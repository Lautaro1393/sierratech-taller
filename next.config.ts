import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.1.36",
    "0.0.0.0",
    "172.16.0.2",
  ],
};

export default nextConfig;
