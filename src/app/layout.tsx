import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { getMetadataBase } from "@/lib/seo/site";

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  applicationName: "LocalLeadster",
  title: {
    default: "LocalLeadster",
    template: "%s | LocalLeadster",
  },
  description:
    "Local lead generation software: Google Places territory prospecting, opportunity signals, HOT/WARM/COLD scoring, CRM pipeline with follow-ups, and branded PDF invoices — one workspace for agencies, freelancers, and sales teams.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "LocalLeadster",
    locale: "en_US",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "LocalLeadster — local B2B prospecting, CRM pipeline, and invoicing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
  referrer: "strict-origin-when-cross-origin",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className="min-h-[100dvh] antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Script id="lgai-theme-boot" src="/lgai-theme-boot.js" strategy="beforeInteractive" />
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
