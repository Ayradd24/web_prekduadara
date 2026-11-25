import type { Metadata } from "next";
import { Be_Vietnam_Pro, Fraunces, Space_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PrekDuaDara — Dashboard Manajemen Gerai",
  description: "Sistem Manajemen Operasional & POS PrekDuaDara",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${fraunces.variable} ${beVietnamPro.variable} ${spaceMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col font-sans subpixel-antialiased text-black">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
