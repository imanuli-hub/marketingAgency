import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Roulette Academy — Training Simulator",
    short_name: "Roulette Academy",
    description: "Learn roulette odds, strategies and bankroll management with virtual money.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#07100c",
    theme_color: "#07100c",
    categories: ["education", "games"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
