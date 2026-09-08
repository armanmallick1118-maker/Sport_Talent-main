import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    const cleanHost = backendUrl.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
    return [
      {
        source: "/api/:path*",
        destination: `${cleanHost}/api/:path*`,
      },
      {
        source: "/ml/:path*",
        destination: "http://127.0.0.1:8001/:path*",
      },
    ];
  },
};

export default nextConfig;
