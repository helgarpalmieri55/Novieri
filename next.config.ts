import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.novieri.com" }],
        destination: "https://novieri.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
