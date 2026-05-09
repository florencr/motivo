import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      {
        source: "/en",
        destination: "/",
        permanent: false,
      },
      {
        source: "/en/:path*",
        destination: "/:path*",
        permanent: false,
      },
      {
        source: "/cars",
        destination: "/makina",
        permanent: true,
      },
      {
        source: "/cars/:path*",
        destination: "/makina/:path*",
        permanent: true,
      },
      {
        source: "/motorcycles",
        destination: "/motocikleta",
        permanent: true,
      },
      {
        source: "/vans",
        destination: "/furgona",
        permanent: true,
      },
      {
        source: "/boats",
        destination: "/varka",
        permanent: true,
      },
      {
        source: "/trucks",
        destination: "/kamione",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
