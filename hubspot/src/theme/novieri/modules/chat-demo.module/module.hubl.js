/**
 * Playback for the chat demo — the vanilla port of ChatDemo.tsx's effect.
 *
 * The conversation is already in the HTML, so it reads fine with no JS and
 * with reduced motion. This hides it, then lets it back in one row at a time
 * with a typing pause before every assistant reply, and replays on a loop.
 */
(function () {
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  document.querySelectorAll("[data-chat-demo]").forEach(function (root) {
    var log = root.querySelector("[data-chat-log]");
    var typing = root.querySelector("[data-chat-typing]");
    if (!log) return;

    var rows = Array.prototype.slice.call(log.querySelectorAll("[data-chat-row]"));
    if (!rows.length) return;

    var timer = null;
    var i = 0;

    function show(el, on) {
      el.style.display = on ? "" : "none";
    }
    function showTyping(on) {
      if (!typing) return;
      typing.classList.toggle("hidden", !on);
      typing.classList.toggle("flex", on);
    }
    function at(ms, fn) {
      timer = setTimeout(fn, ms);
    }

    function reset() {
      i = 0;
      rows.forEach(function (r) {
        show(r, false);
      });
      showTyping(false);
    }

    function next() {
      if (i >= rows.length) {
        // Hold the finished conversation on screen, then start over.
        at(7000, function () {
          reset();
          at(900, next);
        });
        return;
      }
      var row = rows[i];
      if (row.getAttribute("data-chat-row") === "bot") {
        showTyping(true);
        at(1000, function () {
          showTyping(false);
          show(row, true);
          i += 1;
          at(1100, next);
        });
      } else {
        show(row, true);
        i += 1;
        at(row.getAttribute("data-chat-row") === "action" ? 1200 : 900, next);
      }
    }

    reset();
    at(700, next);

    // Editor previews re-render the module; don't leave a timer behind.
    window.addEventListener("beforeunload", function () {
      if (timer) clearTimeout(timer);
    });
  });
})();
