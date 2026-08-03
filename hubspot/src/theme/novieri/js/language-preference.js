/**
 * Sends a first-time visitor to the version of the page in their own language.
 *
 * The rules, in order of who gets the last word:
 *
 * 1. An explicit choice wins forever. Clicking the switcher records the
 *    language picked, and nothing here ever overrides it again.
 * 2. A link that names a language wins for that visit: HubSpot appends
 *    ?hsLang= when it rewrites a link, and someone arriving on /contacto from
 *    a Spanish campaign should stay there.
 * 3. Otherwise, the browser's preference decides — once. The redirect happens
 *    at most one time per visitor, and only when the language they read is one
 *    the site is published in and is not the language they are already on.
 *
 * The destination comes from the language switcher HubSpot renders in the
 * header, which is the only thing that knows the translated URL of this
 * particular page. No guessing at slugs, and a page with no translation
 * quietly does nothing.
 *
 * This runs after paint rather than before it. A redirect that beats the first
 * render would be smoother, but it would also mean shipping the decision into
 * the <head> of every page and betting the whole site on it; a visible flash on
 * one navigation is the cheaper mistake.
 */
(function () {
  var KEY = "novieri-lang";
  var DONE = "novieri-lang-auto";

  function store(name, value) {
    try {
      localStorage.setItem(name, value);
    } catch (e) {
      /* Safari in private mode, and anyone who has turned storage off. */
    }
  }

  function read(name) {
    try {
      return localStorage.getItem(name);
    } catch (e) {
      return null;
    }
  }

  /** Every language this page is published in, as { code: url }. */
  function alternates() {
    var out = {};
    var links = document.querySelectorAll(".lang_switcher_link[data-language]");
    for (var i = 0; i < links.length; i++) {
      out[links[i].getAttribute("data-language")] = links[i].getAttribute("href");
    }
    return out;
  }

  // 1. Remember what the visitor picks, so this never argues with them.
  document.addEventListener("click", function (event) {
    var link = event.target.closest && event.target.closest(".lang_switcher_link[data-language]");
    if (link) store(KEY, link.getAttribute("data-language"));
  });

  var current = document.documentElement.lang || "en";

  // 2. An explicit ?hsLang= is a decision too, and it is this page's.
  var named = new URLSearchParams(location.search).get("hsLang");
  if (named) {
    store(KEY, named.slice(0, 2).toLowerCase());
    return;
  }

  if (read(KEY) || read(DONE)) return;

  var preferred = (navigator.languages && navigator.languages[0]) || navigator.language || "";
  preferred = preferred.slice(0, 2).toLowerCase();
  if (!preferred || preferred === current) return;

  var urls = alternates();
  if (!urls[preferred]) return;

  // Only ever once: if they come back and stay, that is an answer.
  store(DONE, "1");
  location.replace(urls[preferred]);
})();
