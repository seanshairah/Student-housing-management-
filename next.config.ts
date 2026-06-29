import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Use a custom loader so images are resized by the *source* CDN (Unsplash's
    // global Imgix CDN, with edges near the visitor) at device-appropriate
    // sizes — avoiding both Vercel's single-region (us-east) optimizer AND
    // shipping full-size source images on slow mobile connections.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
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
