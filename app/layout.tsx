import type { Metadata } from "next";
import Script from "next/script";
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
  title: {
    default: 'DeliDanis | Tortas Artesanales y Pastelería Premium en Santiago, Chile',
    template: '%s | DeliDanis',
  },
  description: "Pastelería artesanal en Santiago, Chile. Tortas personalizadas para matrimonios, quinceañeros, cumpleaños y eventos corporativos. Coctelería gourmet y catering para eventos. Cotiza gratis.",
  metadataBase: new URL("https://delidanis.cl"),
  keywords: [
    'tortas artesanales Santiago',
    'pastelería premium Chile',
    'tortas personalizadas',
    'tortas para matrimonios',
    'tortas para cumpleaños',
    'pastelería para eventos Santiago',
    'coctelería para eventos',
    'catering dulce Santiago',
    'DeliDanis',
  ],
  authors: [{ name: 'DeliDanis' }],
  creator: 'DeliDanis',
  publisher: 'DeliDanis',
  formatDetection: { telephone: true, email: true },
  alternates: { canonical: 'https://delidanis.cl' },
  openGraph: {
    type: 'website',
    locale: 'es_CL',
    siteName: 'DeliDanis',
    title: 'DeliDanis | Tortas Artesanales y Pastelería Premium en Santiago',
    description: 'Pastelería artesanal en Santiago. Tortas personalizadas, coctelería gourmet y catering para eventos. Cotiza sin compromiso.',
    url: 'https://delidanis.cl',
    images: [{ url: 'https://delidanis.cl/opengraph-image', alt: 'DeliDanis Pastelería', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@delidanis_pasteleria',
    title: 'DeliDanis | Tortas Artesanales en Santiago, Chile',
    description: 'Pastelería artesanal, tortas personalizadas y coctelería para eventos.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable} ${cormorant.variable}`}>
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-18288944043"
          strategy="afterInteractive"
        />
        <Script id="google-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18288944043');
          `}
        </Script>
      </head>
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
          image: 'https://delidanis.cl/opengraph-image',
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
