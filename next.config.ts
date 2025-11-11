import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Redis 관련 모듈을 완전히 무시하여 ECONNREFUSED 오류 방지
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'ioredis': 'commonjs ioredis',
        'redis': 'commonjs redis',
      });
    }
    
    // 런타임에서 Redis 모듈 로드를 완전히 차단
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      'ioredis': false,
      'redis': false,
    };
    
    return config;
  },
};

export default nextConfig;
