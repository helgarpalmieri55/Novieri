/**
 * Sylvi widget behaviour — the vanilla port of src/components/ChatWidget.tsx.
 *
 * The `sig` on each assistant reply is the server's HMAC over that text. It
 * travels back with the next request so the function can tell its own words
 * from an injected turn; drop it and the conversation stops being trusted.
 */
(function () {
  var MAX_CHARS = 1000;

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
      el.className = mine
        ? "mb-3 ml-auto max-w-[85%] rounded-2xl rounded-tr-md bg-plum px-4 py-2.5 text-small text-white"
        : "mb-3 max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-md bg-plum-wash px-4 py-2.5 text-small text-ink";
      el.textContent = text;
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

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var text = input.value.trim().slice(0, MAX_CHARS);
      if (!text || busy) return;

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
        body: JSON.stringify({ messages: messages }),
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
