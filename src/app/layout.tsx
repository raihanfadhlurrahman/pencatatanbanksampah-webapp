import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "BASAH Rejosari - Bank Sampah Dusun Rejosari",
  description: "Sistem Informasi & Pencatatan Tabungan Bank Sampah BASAH Rejosari, Wedomartani",
  icons: {
    icon: "/image/logoBasah.png",
    shortcut: "/image/logoBasah.png",
    apple: "/image/logoBasah.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="icon" href="/image/logoBasah.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/image/logoBasah.png" type="image/png" />
        <link rel="apple-touch-icon" href="/image/logoBasah.png" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
