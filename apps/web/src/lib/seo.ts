const DEFAULT_SITE_URL = "https://wealthwisefinancial.vercel.app";

function normalizeSiteUrl(url: string): string {
  return url.replace(/\/$/, "");
}

export const SITE_URL = normalizeSiteUrl(
  process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : DEFAULT_SITE_URL)
);

export const SITE_NAME = "WealthWise";
export const SITE_TITLE = "WealthWise - Smart Personal Finance Tracker";
export const SITE_DESCRIPTION =
  "WealthWise helps you track income and expenses, manage budgets, monitor recurring bills, and hit savings goals with powerful financial analytics.";

export function absoluteUrl(path = "/"): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
