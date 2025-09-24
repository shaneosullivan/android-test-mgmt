import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Only apply webpack externals for server-side builds
    if (isServer) {
      config.externals = [
        ...config.externals,
        {
          sharp: 'commonjs sharp'
        }
      ];
    }
    return config;
  }
};

export default nextConfig;
