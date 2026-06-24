import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "@base-ui/react",
      "zustand",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
      "recharts",
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://192.168.5.110:8081/api/:path*",
      },
    ];
  },
};

export default nextConfig;