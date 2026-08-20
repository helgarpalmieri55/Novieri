/**
 * Stores the choice in localStorage and tells HubSpot's cookie banner API
 * about it, so the tracking script (and with it the HubSpot cookies) only
 * runs once the visitor has accepted.
 */
(function () {
  var KEY = "novieri-consent";

  function tellHubSpot(choice) {
    // _hsp is a queue HubSpot drains when its script loads, so pushing before
    // it arrives is fine and is in fact the point.
    window._hsp = window._hsp || [];
    window._hsp.push([
      "setHubSpotConsent",
      { analytics: choice === "all", advertisement: false, functionality: true },
    ]);
  }

  // On every load, not only on the click. The decision was pushed once, in the
  // page where the button was pressed, and never again — so a visitor who
  // accepted on Monday came back on Tuesday with the banner correctly hidden
  // and HubSpot still told nothing, which reads as a refusal. Their answer is
  // stored; it has to be repeated to the tracker each time.
  try {
    var stored = localStorage.getItem(KEY);
    if (stored === "all" || stored === "necessary") tellHubSpot(stored);
  } catch (e) {
    /* storage can be off; then there is no decision to repeat */
  }


  /**
   * Two jobs whenever the banner is on screen.
   *
   * One: publish its height, so the chat bubble can step out from under it.
   * Both are fixed to the bottom-right corner and the banner is taller in
   * Spanish than in English, so a hard-coded offset would be wrong in one
   * language or the other. Measuring is cheaper than guessing.
   *
   * Two: move focus to it. It renders at the end of the document, so a
   * keyboard visitor met twenty-two tab stops before reaching the buttons
   * that dismiss it. Focus goes to the container rather than to "Accept all",
   * so the first thing announced is the notice, not one of the answers.
   */
  function raise() {
    var banner = document.querySelector(".cookie-banner");
    if (!banner) return;
    document.documentElement.style.setProperty("--consent-h", banner.offsetHeight + "px");
    banner.focus({ preventScroll: true });
  }

  function lower() {
    document.documentElement.style.removeProperty("--consent-h");
  }

  function decide(choice) {
    try {
      localStorage.setItem(KEY, choice);
    } catch (e) {
      /* private browsing can reject writes; the banner still dismisses */
    }
    document.documentElement.classList.remove("needs-consent");
    lower();
    tellHubSpot(choice);
    window.dispatchEvent(new CustomEvent("novieri:consent", { detail: choice }));
  }

  document.querySelectorAll(".cookie-accept").forEach(function (b) {
    b.addEventListener("click", function () { decide("all"); });
  });
  document.querySelectorAll(".cookie-reject").forEach(function (b) {
    b.addEventListener("click", function () { decide("necessary"); });
  });

  // The footer's "Configurar cookies" link: forget the stored choice and
  // raise the banner again, right where the visitor is standing.
  document.querySelectorAll("[data-cookie-settings]").forEach(function (b) {
    b.addEventListener("click", function () {
      try {
        localStorage.removeItem(KEY);
      } catch (e) {}
      document.documentElement.classList.add("needs-consent");
      raise();
    });
  });

  // The pre-paint script in the <head> decides whether the banner shows, so
  // this only has to react to that decision.
  if (document.documentElement.classList.contains("needs-consent")) raise();
})();
