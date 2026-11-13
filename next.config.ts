import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@electric-sql/pglite", "pg", "sharp", "@pdf-lib/fontkit"],
  outputFileTracingIncludes: {
    "/recipes/[id]/pdf": ["./assets/fonts/**/*"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
};

export default nextConfig;
