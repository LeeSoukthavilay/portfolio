import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      { source: "/api/trade/:path*", destination: "http://localhost:4001/:path*" },
      { source: "/api/trade/ws", destination: "http://localhost:4001/ws" },
      { source: "/api/payment/:path*", destination: "http://localhost:4002/:path*" },
      { source: "/api/ecom/:path*", destination: "http://localhost:4003/:path*" },
      { source: "/api/telemed/:path*", destination: "http://localhost:4004/:path*" },
    ];
  },
};

export default nextConfig;
