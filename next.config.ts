import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.PWA_DISABLED === 'true',
  register: true,
  extendDefaultRuntimeCaching: true,
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: ({ url }: { url: URL }) =>
          url.pathname.startsWith('/api/music/proxy/') ||
          url.pathname.startsWith('/api/music/stream/'),
        handler: 'NetworkOnly',
        method: 'GET',
      },
    ],
  },
});

const nextConfig: NextConfig = {
  htmlLimitedBots: /.*/,
  serverExternalPackages: ['@distube/ytsr', 'youtubei.js'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: '**.ytimg.com' },
    ],
  },
};

export default withPWA(nextConfig);
