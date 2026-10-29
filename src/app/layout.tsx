import type { Metadata, Viewport } from "next";
import { Archivo, Hanken_Grotesk, Instrument_Serif, DM_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], axes: ["wdth"] });
const hanken = Hanken_Grotesk({ variable: "--font-hanken", subsets: ["latin"] });
const instrument = Instrument_Serif({ variable: "--font-instrument", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const dmmono = DM_Mono({ variable: "--font-dmmono", subsets: ["latin"], weight: ["400", "500"] });

const description = "Upload one photo and see your whole cart on you (dress, shoes, bag, jewellery) before you pay. A try-on widget for online fashion shops, built on the YouCam API.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mirrorcart.vercel.app"),
  title: { default: "Mirrorcart: try the whole cart on before you pay", template: "%s · Mirrorcart" },
  description,
  applicationName: "Mirrorcart",
  openGraph: { title: "Mirrorcart: try the whole cart on before you pay", description, siteName: "Mirrorcart", type: "website" },
  twitter: { card: "summary_large_image", title: "Mirrorcart: try the whole cart on before you pay", description },
};

export const viewport: Viewport = { themeColor: "#0f4434" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${hanken.variable} ${instrument.variable} ${dmmono.variable} antialiased`}>{children}</body>
    </html>
  );
}
