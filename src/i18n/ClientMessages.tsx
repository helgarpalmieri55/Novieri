import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

/**
 * Sends only the named namespaces to the browser.
 *
 * The catalog is ~74 KB per locale and every page was inlining all of it —
 * the home page shipped the full privacy policy. Client components read a
 * handful of namespaces; the rest belongs to server components and never
 * needs to cross. Nested inside the layout's provider, this replaces the
 * messages for its subtree, so list everything that subtree reads.
 */
export default async function ClientMessages({
  only,
  children,
}: {
  only: string[];
  children: React.ReactNode;
}) {
  const all = (await getMessages()) as Record<string, unknown>;
  const messages: Record<string, unknown> = {};
  for (const namespace of only) messages[namespace] = all[namespace];
  return <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>;
}
