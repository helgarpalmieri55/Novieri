/**
 * Sylvi widget behaviour — the vanilla port of src/components/ChatWidget.tsx.
 *
 * The `sig` on each assistant reply is the server's HMAC over that text. It
 * travels back with the next request so the function can tell its own words
 * from an injected turn; drop it and the conversation stops being trusted.
 */
(function () {
  var MAX_CHARS = 1000;

  var escapeHtml = function (text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  };

  /**
   * The small part of Markdown the model actually writes back.
   *
   * Replies arrived as one run-on paragraph with literal asterisks in it —
   * "- **Trabajo repetitivo**: agentes de IA que…" — which is unreadable on a
   * phone. This turns the handful of constructs that show up (bold, bullets,
   * numbered steps, links, blank-line paragraphs) into markup and leaves
   * everything else alone.
   *
   * The reply is model output and is treated as untrusted: the text is escaped
   * first, so the only tags in the result are the ones built here. Nothing the
   * model writes can introduce an attribute or an element of its own.
   */
  function render(text) {
    var safe = escapeHtml(text);

    // Links and bare emails, before the inline styling so URLs with
    // underscores or asterisks are already inside an href.
    safe = safe.replace(/\bhttps?:\/\/[^\s<)]+[^\s<).,;:]/g, function (url) {
      return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + "</a>";
    });
    safe = safe.replace(/\b[\w.+-]+@[\w-]+\.[\w.]+\b/g, function (mail) {
      return '<a href="mailto:' + mail + '">' + mail + "</a>";
    });

    safe = safe.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    safe = safe.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");

    // Blocks. A run of "- " or "1. " lines becomes one list; anything else
    // separated by a blank line becomes a paragraph.
    var lines = safe.split(/\n/);
    var out = [];
    var list = null;

    function closeList() {
      if (list) {
        out.push("<" + list.tag + ">" + list.items.join("") + "</" + list.tag + ">");
        list = null;
      }
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      var bullet = line.match(/^[-•*]\s+(.*)$/);
      var numbered = line.match(/^\d+[.)]\s+(.*)$/);

      if (bullet || numbered) {
        var tag = bullet ? "ul" : "ol";
        if (!list || list.tag !== tag) {
          closeList();
          list = { tag: tag, items: [] };
        }
        list.items.push("<li>" + (bullet ? bullet[1] : numbered[1]) + "</li>");
        continue;
      }

      closeList();
      if (line) out.push("<p>" + line + "</p>");
    }
    closeList();

    return out.join("");
  }

  document.querySelectorAll(".sylvi").forEach(function (root) {
    var toggle = root.querySelector(".sylvi-toggle");
    var panel = root.querySelector(".sylvi-panel");
    var log = root.querySelector(".sylvi-log");
    var form = root.querySelector(".sylvi-form");
    var input = root.querySelector(".sylvi-input");
    var send = root.querySelector(".sylvi-send");
    var iconOpen = root.querySelector(".sylvi-icon-open");
    var iconClose = root.querySelector(".sylvi-icon-close");
    var messages = [];
    var busy = false;

    function scrollDown() {
      log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
    }

    function bubble(text, mine) {
      var el = document.createElement("div");
      if (mine) {
        // The visitor's own words go in as text. Nothing they type is markup.
        el.className = "mb-3 ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-plum px-4 py-2.5 text-small text-white";
        el.textContent = text;
      } else {
        el.className = "sylvi-reply mb-3 max-w-[90%] rounded-2xl rounded-tl-md bg-plum-wash px-4 py-3 text-small text-ink";
        el.innerHTML = render(text);
      }
      log.appendChild(el);
      scrollDown();
    }

    function notice(text) {
      var el = document.createElement("p");
      el.className =
        "sylvi-notice mb-3 rounded-lg border border-[#eec4c0] bg-[#fdf3f2] px-3 py-2 text-caption text-[#a13b32]";
      el.textContent = text;
      log.appendChild(el);
      scrollDown();
    }

    function typing(on) {
      var existing = log.querySelector(".sylvi-typing");
      if (!on) {
        if (existing) existing.remove();
        return;
      }
      if (existing) return;
      var el = document.createElement("div");
      el.className =
        "sylvi-typing mb-3 flex w-16 items-center justify-center gap-1 rounded-2xl rounded-tl-md bg-plum-wash px-4 py-3";
      el.setAttribute("aria-live", "polite");
      for (var i = 0; i < 3; i++) {
        var dot = document.createElement("span");
        dot.className = "dot-pulse h-1.5 w-1.5 rounded-full bg-plum";
        dot.style.setProperty("--dd", i * 150 + "ms");
        el.appendChild(dot);
      }
      log.appendChild(el);
      scrollDown();
    }

    toggle.addEventListener("click", function () {
      var open = panel.classList.toggle("hidden") === false;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? toggle.dataset.closeLabel : toggle.dataset.openLabel);
      iconOpen.classList.toggle("hidden", open);
      iconClose.classList.toggle("hidden", !open);
      if (open) input.focus();
    });

    input.addEventListener("input", function () {
      send.disabled = busy || input.value.trim().length === 0;
    });

    // The openers are a shortcut into the same path a typed message takes.
    var starters = root.querySelector(".sylvi-starters");
    if (starters) {
      starters.addEventListener("click", function (event) {
        var chip = event.target.closest(".sylvi-starter");
        if (!chip) return;
        input.value = chip.textContent.trim();
        send.disabled = false;
        form.dispatchEvent(new Event("submit", { cancelable: true }));
      });
    }

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var text = input.value.trim().slice(0, MAX_CHARS);
      if (!text || busy) return;

      // Once the conversation has started they are in the way.
      if (starters) starters.remove();

      var stale = log.querySelector(".sylvi-notice");
      if (stale) stale.remove();

      input.value = "";
      send.disabled = true;
      busy = true;
      messages.push({ role: "user", content: text });
      bubble(text, true);
      typing(true);

      fetch(root.dataset.endpoint, {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: messages, locale: root.dataset.lang }),
      })
        .then(function (res) {
          if (res.status === 429) {
            notice(root.dataset.limit);
            return null;
          }
          if (!res.ok) throw new Error(String(res.status));
          return res.json();
        })
        .then(function (data) {
          if (!data) return;
          messages.push({ role: "assistant", content: data.reply, sig: data.sig });
          bubble(data.reply, false);
        })
        .catch(function () {
          notice(root.dataset.error);
        })
        .finally(function () {
          busy = false;
          typing(false);
          send.disabled = input.value.trim().length === 0;
        });
    });
  });
})();
