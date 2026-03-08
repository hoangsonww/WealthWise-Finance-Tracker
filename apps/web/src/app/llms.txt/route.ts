import { NextResponse } from "next/server";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

const CONTENT = `# WealthWise

> WealthWise is a personal finance web application for tracking transactions, budgets, goals, recurring bills, and analytics.

## Canonical Site
- ${SITE_URL}

## Public Pages
- ${absoluteUrl("/")}
- ${absoluteUrl("/login")}
- ${absoluteUrl("/register")}
- ${absoluteUrl("/forgot-password")}
- ${absoluteUrl("/terms")}
- ${absoluteUrl("/privacy")}

## Restricted App Areas
- Authenticated dashboard pages require a user session and should not be indexed.
- Private routes include: /dashboard, /transactions, /accounts, /budgets, /goals, /analytics, /recurring, /settings, /advisor, /categories.

## Discovery
- Sitemap: ${absoluteUrl("/sitemap.xml")}
- Robots: ${absoluteUrl("/robots.txt")}
- Manifest: ${absoluteUrl("/manifest.webmanifest")}
`;

export function GET() {
  return new NextResponse(CONTENT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
