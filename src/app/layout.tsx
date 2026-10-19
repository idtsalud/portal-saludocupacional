import type { Metadata, Viewport } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-sora" });

export const metadata: Metadata = {
  title: "Portal SaludOcupacional",
  description: "Portal de clientes de SaludOcupacional.com.ar by IDT",
  robots: { index: false, follow: false },
  icons: { icon: "/icono.svg" },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#001b5a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className={sora.variable}>
      <body>{children}</body>
    </html>
  );
}
