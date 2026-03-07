import type { Metadata } from "next";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { QueryProvider } from "@/providers/query-provider";
import { UiPreferencesProvider } from "@/providers/ui-preferences-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://wealthwisefinancial.vercel.app"),

  title: {
    default: "WealthWise – Smart Personal Finance Tracker",
    template: "%s | WealthWise",
  },

  description:
    "WealthWise is your all-in-one personal finance companion. Track income and expenses, manage budgets, set savings goals, monitor recurring bills, and unlock deep financial analytics — all in one secure, intuitive dashboard.",

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
  publisher: "WealthWise",

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
    title: "WealthWise – Smart Personal Finance Tracker",
    description:
      "Take full control of your finances with WealthWise. Track transactions, manage budgets, set savings goals, and gain actionable insights with powerful analytics.",
    url: "https://wealthwisefinancial.vercel.app",
    siteName: "WealthWise",
    locale: "en_US",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "WealthWise – Smart Personal Finance Tracker",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "WealthWise – Smart Personal Finance Tracker",
    description:
      "Track expenses, manage budgets, and hit savings goals with WealthWise — your smart personal finance dashboard.",
    images: ["/icon.svg"],
  },

  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },

  manifest: "/manifest.json",

  alternates: {
    canonical: "https://wealthwisefinancial.vercel.app",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
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
