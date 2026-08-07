// The selector is a progressive enhancement: without this script every
// answer is already on the page and readable. With it, choosing a situation
// shows that one answer and marks the choice.
(function () {
  document.querySelectorAll(".service-selector").forEach(function (root) {
    var picks = root.querySelectorAll(".sel-pick");
    var answers = root.querySelectorAll(".sel-answer");
    if (!picks.length) return;

    function select(index) {
      picks.forEach(function (btn) {
        var on = btn.getAttribute("data-sel") === String(index);
        btn.setAttribute("aria-expanded", on ? "true" : "false");
        btn.classList.toggle("border-plum", on);
        btn.classList.toggle("bg-plum-wash", on);
        btn.classList.toggle("text-ink", on);
        btn.classList.toggle("text-ink-muted", !on);
      });
      answers.forEach(function (a) {
        a.classList.toggle("hidden", a.getAttribute("data-sel-answer") !== String(index));
      });
    }

    picks.forEach(function (btn) {
      btn.addEventListener("click", function () {
        select(btn.getAttribute("data-sel"));
      });
    });

    // Start on the first situation rather than showing all five at once.
    select(0);
  });
})();
