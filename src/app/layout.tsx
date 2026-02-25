import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ConsentBanner from "@/components/ui/ConsentBanner";
import LoadingScreen from "@/components/ui/LoadingScreen";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DreamBreeze -- Science-Based Sleep Comfort System",
  description:
    "Science-based sleep tracking with posture-aware fan control and adaptive soundscapes. All processing on-device.",
  keywords: [
    "sleep",
    "science-based",
    "fan control",
    "posture detection",
    "white noise",
    "smart home",
    "sleep tracking",
  ],
  authors: [{ name: "DreamBreeze" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DreamBreeze",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0a0e27",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/icons/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LoadingScreen />
        {children}
        <ConsentBanner />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
