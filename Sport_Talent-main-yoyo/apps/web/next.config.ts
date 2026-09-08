import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    const defaultBackend = process.env.NODE_ENV === "production"
      ? "https://sporttalent-production.up.railway.app"
      : "http://127.0.0.1:8000";
    const backendUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || defaultBackend;
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
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
          {
            key: "Pragma",
            value: "no-cache",
          },
          {
            key: "Expires",
            value: "0",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
