import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Static export: the site deploys as plain HTML/CSS/JS to GitHub Pages and
// GoDaddy (FTPS). Forms + chatbot are served by the PHP backend in server/api.
// NEXT_PUBLIC_BASE_PATH is set only by the GitHub Pages workflow, where the
// site lives under /<repo-name>/.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default withNextIntl(nextConfig);
