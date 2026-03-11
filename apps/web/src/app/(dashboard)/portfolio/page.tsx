import type { Metadata } from "next";
import { PortfolioPageClient } from "./portfolio-page-client";

export const metadata: Metadata = {
  title: "Portfolio",
  description:
    "Track your investment holdings, monitor asset allocation, and analyze portfolio performance — all in one place.",
  openGraph: {
    title: "Portfolio | WealthWise",
    description:
      "Track your investment holdings, monitor asset allocation, and analyze portfolio performance.",
    url: "/portfolio",
  },
};

export default function PortfolioPage() {
  return <PortfolioPageClient />;
}
