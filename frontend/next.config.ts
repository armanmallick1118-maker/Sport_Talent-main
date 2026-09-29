import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  async rewrites() {
    const isProd = process.env.NODE_ENV === "production";
    const cleanHost = "https://sporttalent-production.up.railway.app";

    const rules: { source: string; destination: string }[] = [
      {
        source: "/api/:path*",
        destination: `${cleanHost}/api/:path*`,
      },
    ];

    if (process.env.ML_MODEL_URL) {
      rules.push({
        source: "/ml/:path*",
        destination: `${process.env.ML_MODEL_URL}/:path*`,
      });
    } else if (!isProd) {
      rules.push({
        source: "/ml/:path*",
        destination: "http://127.0.0.1:8001/:path*",
      });
    }

    if (process.env.CV_MODEL_URL) {
      rules.push({
        source: "/cv/:path*",
        destination: `${process.env.CV_MODEL_URL}/:path*`,
      });
    } else if (!isProd) {
      rules.push({
        source: "/cv/:path*",
        destination: "http://127.0.0.1:8002/:path*",
      });
    }

    return rules;
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
