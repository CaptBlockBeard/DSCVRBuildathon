// /** @type {import('next').NextConfig} */
// const nextConfig = {};


/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://*.dscvr.one https://dscvr.one;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;