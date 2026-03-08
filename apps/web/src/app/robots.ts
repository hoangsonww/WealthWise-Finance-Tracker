import { MetadataRoute } from "next";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/register", "/forgot-password", "/terms", "/privacy", "/llms.txt"],
        disallow: [
          "/dashboard",
          "/transactions",
          "/accounts",
          "/budgets",
          "/goals",
          "/analytics",
          "/recurring",
          "/settings",
          "/advisor",
          "/categories",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: SITE_URL,
  };
}
