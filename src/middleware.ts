import createMiddleware from "next-intl/middleware";
import { routing } from "./routing";

// `/` redirects by Accept-Language (es → /es, everything else → /en) and the
// choice persists via the NEXT_LOCALE cookie — next-intl's default behavior.
export default createMiddleware(routing);

export const config = {
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
