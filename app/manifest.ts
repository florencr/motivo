import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Motivo — Mjete në shitje në Shqipëri",
    short_name: "Motivo",
    description:
      "Shfleto dhe liston makina, motoçikleta, furgona, varka dhe kamionë në shitje në Shqipëri.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f172a",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
