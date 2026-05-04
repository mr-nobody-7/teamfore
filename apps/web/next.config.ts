import type { NextConfig } from "next";

const rawBackendUrl = process.env.BACKEND_URL ?? "http://localhost:4000";
const backendUrl = rawBackendUrl.replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
