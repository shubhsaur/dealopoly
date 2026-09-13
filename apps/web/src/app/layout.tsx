import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "./globals.css";
import { AuthProvider } from "./_components/auth-provider";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dealopoly.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dealopoly - Deal Your Way to Victory",
    template: "%s | Dealopoly",
  },
  description:
    "Experience the ruthless, fast-paced card game where properties change hands, debt collectors knock, and sly deals win the day. Play Monodeal & Lowdeck real-time multiplayer with friends or bots.",
  keywords: [
    "Dealopoly",
    "Monopoly Deal online",
    "Monodeal",
    "Lowdeck",
    "Least Count card game",
    "multiplayer card game",
    "real-time card game",
    "card games with bots",
  ],
  authors: [{ name: "Dealopoly" }],
  creator: "Dealopoly",
  publisher: "Dealopoly",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Dealopoly Arcade",
    title: "Dealopoly - Deal Your Way to Victory",
    description:
      "Play real-time multiplayer card games (Monodeal & Lowdeck) with friends or challenge smart AI bots. No setup required.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Dealopoly Arcade - Real-Time Multiplayer Card Gaming Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dealopoly - Deal Your Way to Victory",
    description:
      "Play real-time multiplayer card games (Monodeal & Lowdeck) with friends or challenge smart AI bots. No setup required.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111415",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

