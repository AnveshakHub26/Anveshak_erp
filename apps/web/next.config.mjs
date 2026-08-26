/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@anveshak/types', '@anveshak/validation'],
  async rewrites() {
    const rawTarget = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://anveshak-erp.onrender.com/api/v1';
    let base = rawTarget.replace(/\/+$/, '');
    if (!base.endsWith('/api/v1')) {
      if (base.includes('/api/v1')) {
        base = base.substring(0, base.indexOf('/api/v1') + '/api/v1'.length);
      } else {
        base = `${base}/api/v1`;
      }
    }
    return [
      {
        source: '/api/v1/:path*',
        destination: `${base}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
