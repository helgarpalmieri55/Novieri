/**
 * Header behaviour: a hairline appears once the page scrolls, and the mobile
 * menu opens. Everything else the header does is HubSpot's (menu, language
 * variants), which is the point — those become editable, not code.
 */
(function () {
  var header = document.querySelector(".site-header");
  if (!header) return;

  var onScroll = function () {
    header.classList.toggle("border-line", window.scrollY > 10);
    header.classList.toggle("border-transparent", window.scrollY <= 10);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /*
   * The desktop mega-menu's keyboard path.
   *
   * Hover is still CSS — group-hover in the markup — so a mouse behaves
   * exactly as before and nothing here runs for it. This adds the path a
   * keyboard never had: the disclosure button flips data-open, which the
   * panel's own utility classes react to, and aria-expanded follows it so
   * the state is announced rather than merely visible.
   *
   * One panel at a time, Escape returns focus to the button that opened it,
   * and a click anywhere else closes whatever is open — the three behaviours
   * a disclosure owes a keyboard user, and the reason this is a button
   * instead of a chevron with a :focus-within rule that could never match.
   */
  var panels = header.querySelectorAll(".nav-disclosure");

  function closeMenus(except) {
    panels.forEach(function (btn) {
      if (btn === except) return;
      btn.setAttribute("aria-expanded", "false");
      var p = btn.parentNode.querySelector(".nav-panel");
      if (p) p.setAttribute("data-open", "false");
    });
  }

  panels.forEach(function (btn) {
    var p = btn.parentNode.querySelector(".nav-panel");
    if (!p) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var open = btn.getAttribute("aria-expanded") !== "true";
      closeMenus(btn);
      btn.setAttribute("aria-expanded", String(open));
      p.setAttribute("data-open", String(open));
    });
    p.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      btn.setAttribute("aria-expanded", "false");
      p.setAttribute("data-open", "false");
      btn.focus();
    });
    btn.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      btn.setAttribute("aria-expanded", "false");
      p.setAttribute("data-open", "false");
    });
  });

  if (panels.length) {
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".site-nav .group")) closeMenus(null);
    });
  }

  var toggle = header.querySelector(".site-menu-toggle");
  var panel = header.querySelector(".site-mobile-nav");
  if (!toggle || !panel) return;

  toggle.addEventListener("click", function () {
    var open = panel.classList.toggle("hidden") === false;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? toggle.dataset.closeLabel : toggle.dataset.openLabel);
    header.querySelector(".site-menu-bars").classList.toggle("hidden", open);
    header.querySelector(".site-menu-x").classList.toggle("hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
    // Closing the menu resets the accordion, so it reopens compact rather
    // than however it was left.
    if (!open) {
      panel.querySelectorAll(".mnav-children").forEach(function (c) { c.classList.add("hidden"); });
      panel.querySelectorAll(".mnav-toggle").forEach(function (b) {
        b.setAttribute("aria-expanded", "false");
        b.querySelector(".mnav-chev").classList.remove("rotate-180");
      });
    }
  });

  // The accordion: sections arrive collapsed, the chevron opens one.
  panel.querySelectorAll(".mnav-toggle").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var children = btn.closest(".mnav-group").querySelector(".mnav-children");
      var open = children.classList.toggle("hidden") === false;
      btn.setAttribute("aria-expanded", String(open));
      btn.querySelector(".mnav-chev").classList.toggle("rotate-180", open);
    });
  });
})();
