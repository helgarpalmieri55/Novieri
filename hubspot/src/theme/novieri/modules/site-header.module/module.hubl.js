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
