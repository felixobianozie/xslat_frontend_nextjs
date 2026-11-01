import type { NextConfig } from "next";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["10.150.175.122"], // Allow access on my local network IP

  // Chromium and its driver are loaded from node_modules when a PDF is made, not
  // bundled into the route.
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium"],

  // Files the PDF route reads at runtime that the build cannot discover itself:
  // the Chromium binaries and the fonts.
  outputFileTracingIncludes: {
    "/api/pdf": ["./node_modules/@sparticuz/chromium/bin/**", "./pdf/fonts/**"],
  },
};

// withBotId adds the rewrites BotID needs so ad-blockers cannot weaken it.
export default withBotId(nextConfig);
