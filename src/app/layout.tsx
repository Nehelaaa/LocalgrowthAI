import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/SessionProvider";

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
  openGraph: {
    type: "website",
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
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-[100dvh] antialiased bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
