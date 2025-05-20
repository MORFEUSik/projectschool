import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8080",
        pathname: "/uploads/**", // Поддержка /uploads с маленькой буквы
      },
    ],
  },
};

export default nextConfig;