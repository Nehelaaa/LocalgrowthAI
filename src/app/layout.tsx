import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { THEME_BOOT_SCRIPT } from "@/lib/theme-preference";

const base = process.env.AUTH_URL
  ? new URL(process.env.AUTH_URL)
  : new URL("http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: base,
  title: {
    default: "LocalLeadster",
    template: "%s | LocalLeadster",
  },
  description:
    "Search Google Places, qualify local leads, and run outreach + pipeline from one clean workspace.",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    siteName: "LocalLeadster",
  },
  twitter: {
    card: "summary_large_image",
  },
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
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
        <ThemeProvider>
          <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
