import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "always",
  pathnames: {
    "/": "/",
    "/services": {
      es: "/servicios",
      en: "/services",
    },
    "/services/ai-automation": {
      es: "/servicios/ia-y-automatizacion",
      en: "/services/ai-automation",
    },
    "/services/managed-it": {
      es: "/servicios/it-administrado",
      en: "/services/managed-it",
    },
    "/services/cybersecurity-compliance": {
      es: "/servicios/ciberseguridad-y-cumplimiento",
      en: "/services/cybersecurity-compliance",
    },
    "/services/custom-software": {
      es: "/servicios/desarrollo-a-medida",
      en: "/services/custom-software",
    },
    "/about": {
      es: "/nosotros",
      en: "/about",
    },
    "/contact": {
      es: "/contacto",
      en: "/contact",
    },
  },
});

export type AppPathname = keyof typeof routing.pathnames;
