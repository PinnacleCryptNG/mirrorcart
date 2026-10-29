import type { Metadata } from "next";
import { Syne, Inter_Tight, Martian_Mono } from "next/font/google";
import "./globals.css";

const syne = Syne({ variable: "--font-syne", subsets: ["latin"], weight: ["500", "600", "700", "800"] });
const inter = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"] });
const martian = Martian_Mono({ variable: "--font-martian", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mirrorcart.vercel.app"),
  title: { default: "Aurel & Thread · Mirrorcart demo store", template: "%s · Aurel & Thread" },
  description: "Mirrorcart: upload one photo and try your whole cart on before you check out. Demo store for the YouCam API Hackathon.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${inter.variable} ${martian.variable} antialiased`}>{children}</body>
    </html>
  );
}
