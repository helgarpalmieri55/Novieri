import { defineRouting } from "next-intl/routing";
import pathnames from "./pathnames.json";

// The pathname map lives in pathnames.json so scripts/localize-export.mjs can
// read the same source of truth when it renames the static-export directories
// to their localized paths (the rewrite middleware used to do at runtime).
export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "always",
  pathnames,
});

export type AppPathname = keyof typeof pathnames;
