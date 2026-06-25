import type { Metadata } from "next";
import Script from "next/script";
import "./main.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://mgnauticabroker.com"),
  title: {
    default: "MG Náutica — Su broker y gestor naval",
    template: "%s · MG Náutica",
  },
  description:
    "Broker y gestor naval en Argentina y Uruguay. Compra, venta, trámites, traslados y mantenimiento de embarcaciones.",
  icons: {
    icon: "/favicon-32.png",
    apple: "/favicon-180.png",
  },
  openGraph: {
    type: "website",
    siteName: "MG Náutica",
    locale: "es_AR",
    images: ["/site/hero-ocean.jpg"],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        {/* Ported as-is from mg-nautica-web: header shadow, mobile burger, scroll reveals. */}
        <Script src="/js/main.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
