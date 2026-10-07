import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pari - Finanzas Personales y Gastos Compartidos",
    short_name: "Pari",
    description: "Gestión inteligente de finanzas personales y gastos compartidos estilo Splitwise",
    start_url: "/",
    display: "standalone",
    background_color: "#090D0B",
    theme_color: "#047857",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
