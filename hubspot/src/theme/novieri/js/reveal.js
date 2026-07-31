/**
 * Scroll reveals. Content is visible by default and `html.js` (set before
 * paint) opts into the animation, so nothing depends on this file loading.
 */
(function () {
  var items = document.querySelectorAll(".reveal, .tick-grow");
  if (!items.length || !("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
  );
  items.forEach(function (el) { io.observe(el); });
})();
