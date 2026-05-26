/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'p16-lemon8-cross-sign.tiktokcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'p19-lemon8-cross-sign.tiktokcdn.com',
      },
      {
        protocol: 'https',
        hostname: 'p16-lemon8-sign-sg.tiktokcdn.com',
      },
    ],
  },
};

module.exports = nextConfig;