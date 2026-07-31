/**
 * Diagnostic quiz behaviour — the vanilla port of DiagnosticForm.tsx.
 *
 * Three stages in one element: the questions, the score plus the contact
 * gate, and the report. The score is computed here so the visitor sees it
 * before giving anything up; the report comes from the serverless function.
 */
(function () {
  document.querySelectorAll("[data-diagnostic]").forEach(function (root) {
    var stages = {
      quiz: root.querySelector('[data-stage="quiz"]'),
      gate: root.querySelector('[data-stage="gate"]'),
      done: root.querySelector('[data-stage="done"]'),
    };
    var questions = Array.prototype.slice.call(root.querySelectorAll("[data-question]"));
    if (!questions.length) return;

    var dots = Array.prototype.slice.call(root.querySelector("[data-dots]").children);
    var progress = root.querySelector("[data-progress]");
    var progressTemplate = progress.getAttribute("data-template") || "";
    var back = root.querySelector("[data-back]");
    var next = root.querySelector("[data-next]");
    var form = root.querySelector("[data-gate]");
    var submit = root.querySelector("[data-submit]");
    var failed = root.querySelector("[data-failed]");
    var locale = (root.getAttribute("data-locale") || "en").slice(0, 2).toLowerCase();
    var endpoint = root.getAttribute("data-endpoint");
    var levels = JSON.parse(root.getAttribute("data-levels") || "[]");
    var step = 0;
    var busy = false;

    function show(stage, scroll) {
      Object.keys(stages).forEach(function (key) {
        if (stages[key]) stages[key].hidden = key !== stage;
      });
      if (scroll) root.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function chosen(index) {
      return questions[index].querySelector("input:checked");
    }

    function render() {
      questions.forEach(function (q, i) {
        q.hidden = i !== step;
        if (i !== step) q.querySelector("[data-required]").hidden = true;
      });
      dots.forEach(function (dot, i) {
        dot.className =
          "h-1.5 w-1.5 rounded-full transition-colors " +
          (i === step ? "bg-plum" : chosen(i) ? "bg-gold" : "bg-line");
      });
      progress.textContent = progressTemplate
        .replace("{n}", String(step + 1))
        .replace("{total}", String(questions.length));
      back.hidden = step === 0;
      next.textContent = step === questions.length - 1 ? next.getAttribute("data-finish") : next.getAttribute("data-next-label");
    }

    function score() {
      var total = 0;
      questions.forEach(function (_, i) {
        var picked = chosen(i);
        if (picked) total += Number(picked.getAttribute("data-weight") || 0);
      });
      // Weights run 0-3, so the ceiling is three points per question.
      var pct = Math.round((total / (questions.length * 3)) * 100);
      var band = pct >= 80 ? 3 : pct >= 55 ? 2 : pct >= 30 ? 1 : 0;
      return { pct: pct, level: levels[band] || "" };
    }

    function toGate() {
      var s = score();
      root.querySelector("[data-level]").textContent = s.level;
      root.querySelector("[data-pct]").textContent = String(s.pct);
      show("gate", true);
      // Set the width after paint so the bar animates rather than jumping.
      requestAnimationFrame(function () {
        root.querySelector("[data-bar]").style.width = s.pct + "%";
      });
    }

    next.addEventListener("click", function () {
      if (!chosen(step)) {
        questions[step].querySelector("[data-required]").hidden = false;
        return;
      }
      if (step < questions.length - 1) {
        step += 1;
        render();
        root.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        toGate();
      }
    });

    back.addEventListener("click", function () {
      if (step > 0) {
        step -= 1;
        render();
      }
    });

    // A pick is an answer; light the dot immediately and drop the warning.
    root.addEventListener("change", function (e) {
      if (e.target.type === "radio") {
        questions[step].querySelector("[data-required]").hidden = true;
        render();
      }
    });

    function fieldError(name, on) {
      var el = form.querySelector('[data-error="' + name + '"]');
      if (el) el.hidden = !on;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (busy) return;
      var data = new FormData(form);
      var name = String(data.get("name") || "").trim();
      var email = String(data.get("email") || "").trim();
      var company = String(data.get("company") || "").trim();

      var problems = 0;
      [["name", !name], ["email", !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)],
       ["company", !company], ["consent", !data.get("consent")]].forEach(function (pair) {
        fieldError(pair[0], pair[1]);
        if (pair[1]) problems += 1;
      });
      if (problems) return;

      busy = true;
      failed.hidden = true;
      submit.disabled = true;
      submit.textContent = submit.getAttribute("data-busy");

      var answers = questions.map(function (q, i) {
        var picked = chosen(i);
        return {
          question: q.querySelector("legend").textContent.trim(),
          answer: picked ? picked.value : "",
        };
      });
      var s = score();

      fetch(endpoint, {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: locale,
          consentText: root.querySelector("[data-consent-text]").textContent.trim(),
          hutk: (document.cookie.match(/hubspotutk=([^;]+)/) || [])[1] || "",
          pageUri: location.href,
          pageName: document.title,
          contact: { name: name, email: email, company: company, phone: String(data.get("phone") || "").trim() },
          website: String(data.get("website") || ""),
          score: s,
          answers: answers,
        }),
      })
        .then(function (res) {
          return res.json().then(function (payload) {
            return { ok: res.ok, payload: payload };
          });
        })
        .then(function (result) {
          if (!result.ok || !result.payload.report) throw new Error(result.payload.error || "failed");
          paint(result.payload.report);
          show("done", true);
        })
        .catch(function () {
          failed.hidden = false;
        })
        .finally(function () {
          busy = false;
          submit.disabled = false;
          submit.textContent = submit.getAttribute("data-idle");
        });
    });

    function bullets(target, items) {
      target.textContent = "";
      items.forEach(function (item) {
        var li = document.createElement("li");
        li.textContent = item;
        target.appendChild(li);
      });
    }

    function paint(report) {
      root.querySelector("[data-headline]").textContent = report.headline || "";
      root.querySelector("[data-summary]").textContent = report.summary || "";
      root.querySelector("[data-closing]").textContent = report.closing || "";

      [["strengths", report.strengths], ["risks", report.risks]].forEach(function (pair) {
        var items = pair[1] || [];
        root.querySelector('[data-block="' + pair[0] + '"]').hidden = !items.length;
        bullets(root.querySelector("[data-" + pair[0] + "]"), items);
      });

      var priorities = report.priorities || [];
      root.querySelector('[data-block="priorities"]').hidden = !priorities.length;
      var list = root.querySelector("[data-priorities]");
      list.textContent = "";
      priorities.forEach(function (p, i) {
        var li = document.createElement("li");
        li.className = "rounded-xl bg-plum-wash p-5";
        var index = document.createElement("span");
        index.className = "idx-mono text-gold-deep";
        index.textContent = "··0" + (i + 1);
        var title = document.createElement("p");
        title.className = "mt-2 font-medium";
        title.textContent = p.title || "";
        var body = document.createElement("p");
        body.className = "mt-1.5 text-small text-ink-muted";
        body.textContent = p.body || "";
        li.append(index, title, body);
        list.appendChild(li);
      });
    }

    root.querySelector("[data-print]").addEventListener("click", function () {
      window.print();
    });

    root.querySelector("[data-again]").addEventListener("click", function () {
      form.reset();
      root.querySelectorAll('input[type="radio"]').forEach(function (input) {
        input.checked = false;
      });
      root.querySelector("[data-bar]").style.width = "0%";
      step = 0;
      render();
      show("quiz", true);
    });

    render();
    show("quiz", false);
  });
})();
