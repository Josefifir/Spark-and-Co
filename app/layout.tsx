import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://spark-and-co.vercel.app";
const SITE_NAME = "Spark & Co.";
const SITE_DESCRIPTION =
  "Machined lighters built for everyday carry. Secure checkout with card or Bitcoin.";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Precision Lighters`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: ["lighters", "precision lighters", "EDC lighter", "torch lighter", "machined lighter"],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "en_IE",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Precision Lighters`,
    description: SITE_DESCRIPTION,
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Precision Lighters`,
    description: SITE_DESCRIPTION,
    images: ["/og-default.png"],
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en": `${SITE_URL}`,
      "de": `${SITE_URL}`,   // same URL, language switcher in header handles locale
      "fr": `${SITE_URL}`,
      "x-default": `${SITE_URL}`,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-graphite text-paper">
        {children}
        <Toaster theme="dark" position="bottom-right" richColors />
      </body>
    </html>
  );
}
