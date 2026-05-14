import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TeamFore",
    short_name: "TeamFore",
    description: "Team availability, leave management & standup visibility",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0F172A",
    theme_color: "#0F6E56",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Apply Leave",
        short_name: "Apply",
        description: "Apply for leave",
        url: "/leaves/apply",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Team Status",
        short_name: "Status",
        description: "View team availability",
        url: "/dashboard",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
    screenshots: [
      {
        src: "/screenshots/dashboard.png",
        sizes: "1280x720",
        type: "image/png",
        label: "Team dashboard",
      },
      {
        src: "/screenshots/apply-leave.png",
        sizes: "1280x720",
        type: "image/png",
        label: "Apply for leave",
      },
    ],
  };
}
