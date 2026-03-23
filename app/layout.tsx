import type { Metadata } from "next";
import { Inter, Playfair_Display, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { JsonLd } from "@/components/JsonLd";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: '--font-playfair',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "DeliDanis - Pastelería Premium",
  description: "Tortas artesanales para eventos especiales. Calidad premium, sabores únicos y diseños personalizados.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} ${cormorant.variable}`}>
      <body className="font-body">
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'Bakery',
          name: 'DeliDanis',
          url: 'https://delidanis.cl',
          telephone: '+56993928764',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'CL',
            addressLocality: 'Chile',
          },
          servesCuisine: 'Pasteleria, Tortas, Cocteleria',
          priceRange: '$$',
          image: 'https://delidanis.cl/logo.png',
        }} />
        {children}
        <ToastContainer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
