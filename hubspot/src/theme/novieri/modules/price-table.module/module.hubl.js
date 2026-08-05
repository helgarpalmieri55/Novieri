// Currency by location, not by language. The timezone is the one location
// signal every browser exposes without a permission prompt or a geo API:
// America/Bogota means Colombia, so pesos; anywhere else budgets in dollars.
// A manual pick from the COP/USD switch wins and is remembered.
(function () {
  var KEY = "novieri-currency";

  function detect() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === "cop" || saved === "usd") return saved;
    } catch (e) {}
    try {
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz === "America/Bogota") return "cop";
    } catch (e) {}
    return "usd";
  }

  function apply(currency) {
    var other = currency === "cop" ? "usd" : "cop";
    document.querySelectorAll(".price-table .price-row").forEach(function (row) {
      // A row priced only for the other market vanishes whole — half the
      // point: the WhatsApp bot is a Colombian offer, the fractional CTO a
      // US one, and neither should show a blank where its price would go.
      row.classList.toggle("hidden", row.getAttribute("data-has-" + currency) !== "1");
    });
    document.querySelectorAll('.price-table [data-price="' + currency + '"]').forEach(function (el) {
      el.classList.remove("hidden");
    });
    document.querySelectorAll('.price-table [data-price="' + other + '"]').forEach(function (el) {
      el.classList.add("hidden");
    });
    document.querySelectorAll("[data-currency-pick]").forEach(function (btn) {
      var active = btn.getAttribute("data-currency-pick") === currency;
      btn.classList.toggle("bg-plum", active);
      btn.classList.toggle("text-white", active);
      btn.classList.toggle("text-ink-muted", !active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
  }

  function init() {
    apply(detect());
    document.querySelectorAll("[data-currency-pick]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pick = btn.getAttribute("data-currency-pick");
        try {
          localStorage.setItem(KEY, pick);
        } catch (e) {}
        apply(pick);
      });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
