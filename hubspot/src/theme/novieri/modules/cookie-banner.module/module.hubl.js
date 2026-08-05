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

  function decide(choice) {
    try {
      localStorage.setItem(KEY, choice);
    } catch (e) {
      /* private browsing can reject writes; the banner still dismisses */
    }
    document.documentElement.classList.remove("needs-consent");
    tellHubSpot(choice);
    window.dispatchEvent(new CustomEvent("novieri:consent", { detail: choice }));
  }

  document.querySelectorAll(".cookie-accept").forEach(function (b) {
    b.addEventListener("click", function () { decide("all"); });
  });
  document.querySelectorAll(".cookie-reject").forEach(function (b) {
    b.addEventListener("click", function () { decide("necessary"); });
  });
})();
