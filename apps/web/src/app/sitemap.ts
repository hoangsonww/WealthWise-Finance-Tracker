import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://wealthwisefinancial.vercel.app",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: "https://wealthwisefinancial.vercel.app/login",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.8,
    },
    {
      url: "https://wealthwisefinancial.vercel.app/register",
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.8,
    },
  ];
}
