/**
 * Custom Next.js image loader.
 *
 * Instead of routing images through Vercel's image optimizer (single region,
 * us-east — slow for far-away users) OR serving full-size source images
 * (heavy on slow mobile connections), this asks the *source* CDN to resize.
 *
 * Unsplash images are served by Imgix (a global CDN with edges near most
 * users, including Southern Africa) and accept `w`/`q`/`auto`/`fit` URL
 * params. We rewrite the requested width/quality so the browser downloads a
 * device-appropriate, lightweight image from a nearby edge — fast latency AND
 * small payload. Non-Unsplash sources are returned unchanged.
 */
interface LoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  if (src.includes("images.unsplash.com")) {
    try {
      const url = new URL(src);
      url.searchParams.set("w", String(width));
      url.searchParams.set("q", String(quality ?? 65));
      url.searchParams.set("auto", "format"); // WebP/AVIF where supported
      url.searchParams.set("fit", "crop");
      return url.toString();
    } catch {
      return src;
    }
  }
  return src;
}
