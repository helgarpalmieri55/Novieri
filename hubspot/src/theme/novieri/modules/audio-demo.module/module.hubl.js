// Progressive enhancement for the demo cards: the markup ships a native
// <audio controls>, and this script swaps it for the styled player — play
// button, dancing equalizer, seekable bar. Only one call plays at a time,
// like a phone.
(function () {
  function fmt(s) {
    if (!isFinite(s)) return "0:00";
    var m = Math.floor(s / 60);
    var r = Math.floor(s % 60);
    return m + ":" + (r < 10 ? "0" : "") + r;
  }

  function enhance(card) {
    var audio = card.querySelector("audio");
    var toggle = card.querySelector(".ad-toggle");
    var track = card.querySelector(".ad-track");
    var fill = card.querySelector(".ad-fill");
    var time = card.querySelector(".ad-time");
    if (!audio || !toggle) return;

    audio.removeAttribute("controls");
    audio.classList.add("hidden");
    toggle.classList.remove("hidden");
    toggle.classList.add("inline-flex");
    track.classList.remove("hidden");
    time.classList.remove("hidden");

    toggle.addEventListener("click", function () {
      if (audio.paused) {
        document.querySelectorAll(".audio-demo audio").forEach(function (other) {
          if (other !== audio) other.pause();
        });
        audio.play();
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play", function () { card.classList.add("is-playing"); });
    audio.addEventListener("pause", function () { card.classList.remove("is-playing"); });
    audio.addEventListener("ended", function () {
      card.classList.remove("is-playing");
      audio.currentTime = 0;
      fill.style.width = "0%";
      time.textContent = fmt(audio.duration);
    });

    audio.addEventListener("loadedmetadata", function () {
      time.textContent = fmt(audio.duration);
    });
    audio.addEventListener("timeupdate", function () {
      if (audio.duration) fill.style.width = (audio.currentTime / audio.duration) * 100 + "%";
      time.textContent = fmt(audio.paused && audio.currentTime === 0 ? audio.duration : audio.currentTime);
    });

    track.addEventListener("click", function (e) {
      var rect = track.getBoundingClientRect();
      if (audio.duration) {
        audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
      }
    });
  }

  function init() {
    document.querySelectorAll(".audio-demo .ad-card").forEach(enhance);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
