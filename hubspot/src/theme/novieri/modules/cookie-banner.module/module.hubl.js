/**
 * Stores the choice in localStorage and tells HubSpot's cookie banner API
 * about it, so the tracking script (and with it the HubSpot cookies) only
 * runs once the visitor has accepted.
 */
(function () {
  var KEY = "novieri-consent";

  function decide(choice) {
    try {
      localStorage.setItem(KEY, choice);
    } catch (e) {
      /* private browsing can reject writes; the banner still dismisses */
    }
    document.documentElement.classList.remove("needs-consent");
    if (window._hsp) {
      window._hsp.push(["setHubSpotConsent", { analytics: choice === "all", advertisement: false, functionality: true }]);
    }
    window.dispatchEvent(new CustomEvent("novieri:consent", { detail: choice }));
  }

  document.querySelectorAll(".cookie-accept").forEach(function (b) {
    b.addEventListener("click", function () { decide("all"); });
  });
  document.querySelectorAll(".cookie-reject").forEach(function (b) {
    b.addEventListener("click", function () { decide("necessary"); });
  });
})();
