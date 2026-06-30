import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
// Editorial grotesque for display headings (modern, premium feel).
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Student Housing — Mufudzi & Siphiwe House",
    template: "%s · Student Housing",
  },
  description:
    "Modern, secure student accommodation at Mufudzi House and Siphiwe House. Browse rooms, apply online, and manage everything from your portal.",
  keywords: [
    "student housing",
    "student accommodation",
    "Mufudzi House",
    "Siphiwe House",
  ],
};

export const viewport: Viewport = {
  themeColor: "#157857",
  width: "device-width",
  initialScale: 1,
  // Let content extend under the notch / home indicator so the bottom tab bar
  // can use env(safe-area-inset-*) and feel like a native app.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster richColors position="top-center" closeButton />
      </body>
    </html>
  );
}
