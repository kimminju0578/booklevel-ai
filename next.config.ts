import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "https", hostname: "*.kakaocdn.net" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
    ],
  },
};

export default nextConfig;
