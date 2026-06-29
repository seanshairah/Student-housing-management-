import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Serve images straight from their source CDN (Unsplash's global Imgix CDN
    // already resizes/format-negotiates via the URL params) instead of routing
    // every image through Vercel's optimizer, which runs in a single region
    // (us-east) and adds a long round-trip for users far from it. This makes
    // images load from a CDN edge near the visitor and removes the optimizer
    // as a latency/quota/concurrency bottleneck.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.public.blob.vercel-storage.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
