import { notFound } from "next/navigation";

/**
 * Static hosting handles unknown paths via the server 404 page, so this
 * catch-all only pre-renders /{locale}/404/ — the localized not-found HTML
 * that the deploy workflows copy to /404.html (GitHub Pages + .htaccess).
 */
export function generateStaticParams() {
  return [{ rest: ["404"] }];
}

export default function CatchAllPage() {
  notFound();
}
