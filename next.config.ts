import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 414, 640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Content-Type",
            value: "application/xml; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
          },
          {
            key: "X-Robots-Tag",
            value: "all",
          },
        ],
      },
      {
        source: "/sitemap.php",
        headers: [
          {
            key: "Content-Type",
            value: "application/xml; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200",
          },
          {
            key: "X-Robots-Tag",
            value: "all",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/about.php",
        destination: "/about",
        permanent: true,
      },
      {
        source: "/complaint.php",
        destination: "/complaints",
        permanent: true,
      },
      {
        source: "/curriculum.php",
        destination: "/curriculum",
        permanent: true,
      },
      {
        source: "/download.php",
        destination: "/downloads",
        permanent: true,
      },
      {
        source: "/executives.php",
        destination: "/executives",
        permanent: true,
      },
      {
        source: "/gallery.php",
        destination: "/gallery",
        permanent: true,
      },
      {
        source: "/ita.php",
        destination: "/ita",
        permanent: true,
      },
      {
        source: "/news.php",
        destination: "/news",
        permanent: true,
      },
      {
        source: "/personnel.php",
        destination: "/personnel",
        permanent: true,
      },
      {
        source: "/personnel_dept.php",
        destination: "/personnel",
        permanent: true,
      },
      {
        source: "/personnel_sub_dept.php",
        destination: "/personnel",
        permanent: true,
      },
      {
        source: "/personnel_detail.php",
        destination: "/personnel",
        permanent: true,
      },
      {
        source: "/index.php",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
