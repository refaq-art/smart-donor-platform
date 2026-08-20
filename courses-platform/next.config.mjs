/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
    // تُترك هذه الحزم خارج تجميع Next.js لتُحمَّل كوحدات Node عادية وقت التشغيل.
    // Prisma يحتاج محرك استعلامات ثنائيًا لا يُجمَّع بشكل صحيح داخل حزمة الدالة،
    // وعملاء libsql لهم مسارات استيراد شرطية — تجميعهما يكسرهما على استضافات
    // بلا حالة مثل Vercel.
    serverComponentsExternalPackages: [
      "@prisma/client",
      ".prisma/client",
      "@prisma/adapter-libsql",
      "@libsql/client",
    ],
  },
};

export default nextConfig;
