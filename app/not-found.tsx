import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "This page doesn't exist. Head back to the shop.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-graphite text-paper flex flex-col items-center justify-center px-6 text-center">
      {/* Flame SVG */}
      <div className="animate-flicker mb-8 select-none" aria-hidden="true">
        <svg
          width="64"
          height="88"
          viewBox="0 0 64 88"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* outer flame */}
          <path
            d="M32 4C32 4 52 24 52 44C52 58.912 43.255 68 32 68C20.745 68 12 58.912 12 44C12 24 32 4 32 4Z"
            fill="#ff7a1a"
            opacity="0.9"
          />
          {/* inner core */}
          <path
            d="M32 30C32 30 42 40 42 50C42 56.627 37.523 62 32 62C26.477 62 22 56.627 22 50C22 40 32 30 32 30Z"
            fill="#ffa54d"
            opacity="0.85"
          />
          {/* hot tip */}
          <path
            d="M32 42C32 42 36 47 36 51C36 53.761 34.209 56 32 56C29.791 56 28 53.761 28 51C28 47 32 42 32 42Z"
            fill="#fff8f0"
            opacity="0.7"
          />
          {/* wick / lighter top */}
          <rect x="28" y="66" width="8" height="4" rx="1" fill="#8a8d93" />
          {/* lighter body */}
          <rect x="18" y="70" width="28" height="18" rx="4" fill="#26282c" />
          <rect x="20" y="72" width="24" height="14" rx="3" fill="#34363b" />
          {/* highlight stripe */}
          <rect x="22" y="73" width="4" height="12" rx="2" fill="#8a8d93" opacity="0.25" />
        </svg>
      </div>

      {/* Error code */}
      <p className="font-mono-tech text-flame text-sm tracking-[0.2em] uppercase mb-3">
        Error 404
      </p>

      {/* Headline */}
      <h1 className="font-display text-4xl sm:text-5xl font-bold text-paper mb-4 leading-tight">
        Nothing&apos;s burning here.
      </h1>

      {/* Sub */}
      <p className="text-steel text-base sm:text-lg max-w-sm mb-10 leading-relaxed">
        That page doesn&apos;t exist or may have been moved. Let&apos;s get
        you back to the good stuff.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/"
          className="px-6 py-3 rounded bg-flame text-graphite font-semibold text-sm hover:bg-flame-bright transition-colors"
        >
          Back to home
        </Link>
        <Link
          href="/products"
          className="px-6 py-3 rounded border border-hairline text-paper-dim text-sm hover:text-paper hover:border-steel transition-colors"
        >
          Browse products
        </Link>
      </div>

      {/* Muted footer hint */}
      <p className="mt-16 font-mono-tech text-xs text-steel opacity-40 tracking-widest uppercase">
        Spark &amp; Co. — Precision Lighters
      </p>
    </div>
  );
}
