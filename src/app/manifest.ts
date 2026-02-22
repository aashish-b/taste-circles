import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Taste Circles",
    short_name: "Circles",
    description: "Track and share media taste with circles.",
    start_url: "/me",
    display: "standalone",
    background_color: "#0C1210",
    theme_color: "#1F6B4A",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}
