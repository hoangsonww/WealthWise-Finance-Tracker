import type { Metadata } from "next";
import LandingPage from "./landing-page-client";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Smart Personal Finance Tracker",
  description:
    "Take control of your money with WealthWise. Track expenses, build budgets, set savings goals, and monitor financial trends in one secure dashboard.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${SITE_NAME} - Smart Personal Finance Tracker`,
    description:
      "Track transactions, manage budgets, and reach savings goals with analytics-driven insights.",
    url: "/",
    siteName: SITE_NAME,
    type: "website",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "WealthWise personal finance dashboard",
      },
      {
        url: absoluteUrl("/android-chrome-512x512.png"),
        width: 512,
        height: 512,
        alt: "WealthWise app icon",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - Smart Personal Finance Tracker`,
    description: "Track expenses, manage budgets, and reach savings goals with WealthWise.",
    images: [absoluteUrl("/twitter-image"), absoluteUrl("/android-chrome-512x512.png")],
  },
};

export default function HomePage() {
  return <LandingPage />;
}
