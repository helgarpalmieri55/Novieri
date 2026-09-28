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

    /*
     * Start when the section is actually on screen, not when the page loads.
     *
     * It used to begin 700ms after the script ran, and this section sits
     * 5,080px down the home page. Measured without scrolling once: the
     * conversation built itself from 0 to 9 rows in twelve seconds, held for
     * eight, and looped — all of it while the visitor was still reading the
     * headline. By the time anyone scrolled down, the chat was finished and
     * sitting still, which reads as an animation that is broken rather than
     * one that already ran. The single most persuasive thing on the page was
     * being spent on an empty room.
     *
     * Leaving the viewport resets it, so scrolling back replays the
     * conversation from the first message instead of showing the end of it.
     */
    reset();

    function start() {
      if (timer) clearTimeout(timer);
      reset();
      at(700, next);
    }
    function stop() {
      if (timer) clearTimeout(timer);
      timer = null;
      reset();
    }

    if (typeof IntersectionObserver === "function") {
      var running = false;
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !running) {
            running = true;
            start();
          } else if (!entry.isIntersecting && running) {
            running = false;
            stop();
          }
        });
      }, { threshold: 0.35 }).observe(root);
    } else {
      // No observer: behave as before rather than never playing at all.
      start();
    }

    // Editor previews re-render the module; don't leave a timer behind.
    window.addEventListener("beforeunload", function () {
      if (timer) clearTimeout(timer);
    });
  });
})();
