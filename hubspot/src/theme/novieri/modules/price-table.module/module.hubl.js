// Currency by location, full stop. The timezone is the one location signal
// every browser exposes without a permission prompt or a geo API:
// America/Bogota means Colombia, so pesos; anywhere else budgets in dollars.
// There is deliberately no manual switch and no remembered choice — the
// owner's rule: each market sees its own list, and nothing invites comparing
// them. (The old toggle's localStorage key is left unread so a stale value
// from before this change can't pin anyone to the wrong currency.)
(function () {
  function detect() {
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
  }

  function init() {
    apply(detect());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
