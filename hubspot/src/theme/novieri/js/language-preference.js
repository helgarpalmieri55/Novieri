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
 * 3. Otherwise, the browser's preference decides — once, and only for someone
 *    who arrived at the bare site root. The redirect happens at most one time
 *    per visitor, and only when the language they read is one the site is
 *    published in and is not the language they are already on.
 *
 * Rule 3 used to apply to every page, and that was a bug with a real cost. A
 * URL deeper than "/" is a destination somebody chose: it came from a search
 * result, an ad, or a link a person sent. Landing on /precios and being moved
 * to /pricing because the handset's system language happens to be English
 * throws away the one thing the visitor actually told us — and Colombian
 * Android phones very commonly run an English system locale, so this fired on
 * exactly the audience the Spanish site exists for. Measured before the fix:
 * an en-US browser requesting /es was served /, and /precios was served
 * /pricing. It also silently defeated the hreflang cluster, which spends its
 * whole existence telling Google those Spanish URLs are the right ones to
 * send Spanish speakers to.
 *
 * The bare root is the one address that expresses no preference, so it is the
 * one address where guessing is welcome.
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

  /**
   * A page with no counterpart in the other language renders no switcher at
   * all, and becomes a dead end: /industrias/pymes and /industrias/restaurantes
   * exist only in Spanish, and a visitor who lands on either has no way back
   * to English from the header. HubSpot is right not to invent a translated
   * URL — the page genuinely does not exist — but "no counterpart" should be
   * an answer, not silence.
   *
   * So the other language's home page stands in. It is honest about what it
   * offers: not this page in English, but English.
   */
  function fallbackSwitcher() {
    if (document.querySelector(".lang_switcher_link")) return;
    var other = current === "es"
      ? { code: "en", href: "/", label: "English" }
      : { code: "es", href: "/es", label: "Español" };
    var hosts = document.querySelectorAll(".lang-toggle");
    for (var i = 0; i < hosts.length; i++) {
      if (hosts[i].querySelector("a")) continue;
      var link = document.createElement("a");
      link.className = "lang_switcher_link lang-fallback";
      link.setAttribute("data-language", other.code);
      link.setAttribute("lang", other.code);
      link.href = other.href;
      link.textContent = other.label;
      hosts[i].appendChild(link);
    }
  }

  fallbackSwitcher();

  // 2. An explicit ?hsLang= is a decision too, and it is this page's.
  var named = new URLSearchParams(location.search).get("hsLang");
  if (named) {
    store(KEY, named.slice(0, 2).toLowerCase());
    return;
  }

  if (read(KEY) || read(DONE)) return;

  // 3. Only from the front door. Any deeper path was asked for by name.
  if (location.pathname !== "/") return;

  var preferred = (navigator.languages && navigator.languages[0]) || navigator.language || "";
  preferred = preferred.slice(0, 2).toLowerCase();
  if (!preferred || preferred === current) return;

  var urls = alternates();
  if (!urls[preferred]) return;

  // Only ever once: if they come back and stay, that is an answer.
  store(DONE, "1");
  location.replace(urls[preferred]);
})();
