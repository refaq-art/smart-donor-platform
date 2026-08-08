/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // نتجاهل مخرجات Playwright (لقطات/تتبعات تُكتب أثناء تشغيل الاختبارات) كي لا
      // تُشغّل Fast Refresh مرارًا وتُقاطع تنقّلات العميل الجارية أثناء اختبارات E2E.
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules/**', '**/.git/**', '**/test-results/**', '**/playwright-report/**'],
      };
    }
    return config;
  },
};

export default nextConfig;
