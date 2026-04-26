import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  webpack: (config) => {
    // Node.js 22/24 + webpack WASM hash bug workaround: use sha256 (no WASM dependency)
    config.output.hashFunction = "sha256";
    // Bust stale Vercel build cache that causes ERR_INVALID_ARG_TYPE on sha256.update(undefined)
    config.output.hashSalt = "v2";
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
