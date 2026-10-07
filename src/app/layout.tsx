import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pari - Finanzas Personales y Gastos Compartidos",
  description: "Controla tus finanzas personales y comparte gastos estilo Splitwise con soporte multimoneda y entrada por voz.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Pari",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#047857",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-[#090D0B] text-zinc-100 antialiased selection:bg-[#D4AF37]/30 selection:text-[#F3E5AB]">
        {children}
      </body>
    </html>
  );
}
