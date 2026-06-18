import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DESKFLOW_BRAND_ICON } from "@/lib/brandIcon";
import { Providers } from "./providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeskFlow",
  description: "DeskQ session monitor with 11-minute focus cycles",
  icons: {
    icon: DESKFLOW_BRAND_ICON,
    apple: DESKFLOW_BRAND_ICON,
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
      className={`${geistSans.variable} ${geistMono.variable} h-full w-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full w-full overflow-hidden font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
