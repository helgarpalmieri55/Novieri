/**
 * Hero motion, ported from GemStage.tsx and PillarTicker.tsx: a particle field
 * drifting inward, the mark following the pointer, and the eyebrow cycling
 * through the pillar words. All three are decoration and all three stop under
 * prefers-reduced-motion — the mark and the first word stay put.
 */
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var COLORS = ["#264e59", "#4f3461", "#a8875c", "#b0aabd"];

  document.querySelectorAll(".gem-particles").forEach(function (canvas) {
    var cx = canvas.getContext("2d");
    if (!cx) return;
    var gem = canvas.parentElement.querySelector(".gem-parallax");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0;
    var H = 0;
    var raf = 0;

    function size() {
      W = canvas.width = canvas.offsetWidth * dpr;
      H = canvas.height = canvas.offsetHeight * dpr;
    }
    size();
    new ResizeObserver(size).observe(canvas);

    var parts = [];
    for (var i = 0; i < 70; i++) {
      parts.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.7 + 0.5,
        v: Math.random() * 0.0018 + 0.0005,
        c: COLORS[i % COLORS.length],
        tw: Math.random() * Math.PI * 2,
      });
    }

    function draw(t) {
      cx.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        var dx = 0.5 - p.x;
        var dy = 0.5 - p.y;
        p.x += dx * p.v;
        p.y += dy * p.v;
        if (Math.abs(dx) < 0.02 && Math.abs(dy) < 0.02) {
          p.x = Math.random();
          p.y = Math.random() < 0.5 ? 0.02 : 0.98;
        }
        cx.globalAlpha = 0.12 + 0.3 * Math.abs(Math.sin(t / 900 + p.tw));
        cx.fillStyle = p.c;
        cx.beginPath();
        cx.arc(p.x * W, p.y * H, p.r * dpr, 0, 7);
        cx.fill();
      });
      cx.globalAlpha = 1;
      if (!reduced) raf = requestAnimationFrame(draw);
    }
    draw(0);

    if (!reduced && gem) {
      window.addEventListener(
        "mousemove",
        function (e) {
          var rx = (e.clientX / window.innerWidth - 0.5) * 16;
          var ry = (e.clientY / window.innerHeight - 0.5) * 12;
          gem.style.transform = "translate(" + rx + "px, " + ry + "px)";
        },
        { passive: true },
      );
    }

    window.addEventListener("pagehide", function () {
      cancelAnimationFrame(raf);
    });
  });

})();
