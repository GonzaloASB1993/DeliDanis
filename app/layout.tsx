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
  title: "DeliDanis - Pastelería y Tortas Artesanales en Chile",
  description: "Pastelería artesanal premium en Santiago, Chile. Tortas personalizadas para matrimonios, quinceañeros, cumpleaños y eventos corporativos. Ingredientes de calidad, diseños únicos.",
  metadataBase: new URL("https://delidanis.cl"),
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
          description: 'Pastelería artesanal premium especializada en tortas personalizadas para matrimonios, quinceañeros, cumpleaños y eventos corporativos en Santiago, Chile.',
          url: 'https://delidanis.cl',
          telephone: '+56939282764',
          email: 'contacto@delidanis.cl',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'CL',
            addressLocality: 'Santiago',
            addressRegion: 'Región Metropolitana',
          },
          servesCuisine: ['Pastelería', 'Tortas', 'Coctelería'],
          priceRange: '$$',
          image: 'https://delidanis.cl/logo.png',
          logo: {
            '@type': 'ImageObject',
            url: 'https://delidanis.cl/logo.png',
          },
          sameAs: [
            'https://instagram.com/delidanis_pasteleria',
            'https://facebook.com/delidanis',
            'https://tiktok.com/@delidanis',
          ],
          openingHoursSpecification: [
            {
              '@type': 'OpeningHoursSpecification',
              dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
              opens: '09:00',
              closes: '19:00',
            },
          ],
        }} />
        {children}
        <ToastContainer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
