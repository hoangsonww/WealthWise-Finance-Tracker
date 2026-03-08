import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "WealthWise - Smart Personal Finance Tracker",
    short_name: "WealthWise",
    description:
      "Track expenses, build budgets, manage recurring bills, and reach savings goals with one personal finance app.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    background_color: "#ffffff",
    theme_color: "#0f172a",
    orientation: "portrait-primary",
    categories: ["finance", "productivity"],
    lang: "en-US",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Sign In",
        short_name: "Login",
        description: "Access your WealthWise dashboard",
        url: "/login",
      },
      {
        name: "Create Account",
        short_name: "Register",
        description: "Create a WealthWise account",
        url: "/register",
      },
    ],
  };
}
