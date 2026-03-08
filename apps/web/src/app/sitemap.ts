import { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const LAST_MODIFIED = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }> = [
    { path: "/", changeFrequency: "weekly", priority: 1 },
    { path: "/login", changeFrequency: "monthly", priority: 0.6 },
    { path: "/register", changeFrequency: "monthly", priority: 0.7 },
    { path: "/forgot-password", changeFrequency: "yearly", priority: 0.3 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.4 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.4 },
    { path: "/llms.txt", changeFrequency: "weekly", priority: 0.2 },
  ];

  return publicRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: LAST_MODIFIED,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
