"use client";

import { useEffect } from "react";
import { applyUiPreferences, getStoredUiPreferences } from "@/lib/ui-preferences";

export function UiPreferencesProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    applyUiPreferences(getStoredUiPreferences());
  }, []);

  return children;
}
