import type { NextConfig } from "next";
import { networkInterfaces } from "node:os";

function discoverLocalNetworkOrigins() {
  try {
    return Object.values(networkInterfaces())
      .flatMap((addresses) => addresses ?? [])
      .filter((address) => address.family === "IPv4" && !address.internal)
      .map((address) => address.address);
  } catch {
    return [];
  }
}

const localNetworkOrigins = discoverLocalNetworkOrigins();
const configuredDevOrigins = (process.env.DEV_ALLOWED_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  // Next.js protects development assets from unknown origins. Discover the
  // machine's LAN addresses so mobile testing keeps working if DHCP changes IP.
  allowedDevOrigins: [...new Set([...localNetworkOrigins, ...configuredDevOrigins])],
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
