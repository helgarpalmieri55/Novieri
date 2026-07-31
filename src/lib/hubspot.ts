/**
 * Context sent with every form submission so HubSpot can attribute it.
 *
 * `hubspotutk` is the tracking cookie: it links this submission to every page
 * the visitor read beforehand. It only exists once they accept cookies — when
 * they decline, the submission still lands, just without browsing history
 * attached, which is the correct privacy behaviour rather than a bug.
 */
export function trackingContext(): { hutk: string; pageUri: string; pageName: string } {
  const hutk =
    typeof document === "undefined"
      ? ""
      : (document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/)?.[1] ?? "");

  return {
    hutk,
    pageUri: typeof location === "undefined" ? "" : location.href,
    pageName: typeof document === "undefined" ? "" : document.title,
  };
}
