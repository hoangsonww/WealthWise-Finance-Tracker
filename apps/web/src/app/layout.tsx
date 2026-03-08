import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { UiPreferencesProvider } from "@/providers/ui-preferences-provider";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, absoluteUrl } from "@/lib/seo";
import "./globals.css";

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  inLanguage: "en-US",
};

const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  applicationCategory: "FinanceApplication",
  operatingSystem: "Any",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description: SITE_DESCRIPTION,
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/android-chrome-512x512.png"),
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | WealthWise",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "Personal Finance",
  referrer: "origin-when-cross-origin",
  keywords: [
    "personal finance",
    "budget tracker",
    "expense tracker",
    "income tracker",
    "savings goals",
    "financial analytics",
    "money management",
    "net worth tracker",
    "recurring bills",
    "spending insights",
    "financial dashboard",
    "transaction manager",
    "finance app",
    "wealth tracker",
    "free budget app",
  ],
  authors: [{ name: "Son Nguyen", url: "https://github.com/hoangsonww" }],
  creator: "Son Nguyen",
  publisher: SITE_NAME,
  formatDetection: {
    telephone: false,
    address: false,
    email: false,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    images: [
      {
        url: absoluteUrl("/opengraph-image"),
        width: 1200,
        height: 630,
        alt: "WealthWise - Smart Personal Finance Tracker",
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
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/twitter-image"), absoluteUrl("/android-chrome-512x512.png")],
  },
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
    shortcut: "/icon.svg",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-US": SITE_URL,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />

        <ThemeProvider>
          <UiPreferencesProvider>
            <AuthProvider>
              <QueryProvider>
                {children}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    classNames: {
                      toast: "group toast bg-background text-foreground border-border shadow-lg",
                      title: "text-foreground font-semibold",
                      description: "text-foreground/70",
                      actionButton: "bg-primary text-primary-foreground hover:bg-primary/90",
                      cancelButton: "bg-muted text-muted-foreground hover:bg-muted/90",
                      error: "!bg-destructive !text-destructive-foreground !border-destructive",
                      success: "!bg-success !text-success-foreground !border-success",
                    },
                  }}
                  richColors
                  closeButton
                />
              </QueryProvider>
            </AuthProvider>
          </UiPreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
