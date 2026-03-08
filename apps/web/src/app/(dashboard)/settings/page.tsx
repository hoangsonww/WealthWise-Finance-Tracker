import type { Metadata } from "next";
import { SettingsPageClient } from "./settings-page-client";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Manage your WealthWise account settings. Update your profile, customize transaction categories, export your data, and configure account preferences.",
  openGraph: {
    title: "Settings | WealthWise",
    description:
      "Manage your WealthWise account settings — update profile, customize categories, export data, and configure preferences.",
    url: "/settings",
  },
};

export default function SettingsPage() {
  return <SettingsPageClient />;
}
