export interface UiPreferences {
  reducedMotion: boolean;
  highContrast: boolean;
}

export const UI_PREFERENCES_STORAGE_KEY = "wealthwise-ui-preferences";

export const DEFAULT_UI_PREFERENCES: UiPreferences = {
  reducedMotion: false,
  highContrast: false,
};

export function getStoredUiPreferences(): UiPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_UI_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(UI_PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_UI_PREFERENCES;
    }

    const parsed = JSON.parse(raw) as Partial<UiPreferences>;
    return {
      reducedMotion: parsed.reducedMotion ?? DEFAULT_UI_PREFERENCES.reducedMotion,
      highContrast: parsed.highContrast ?? DEFAULT_UI_PREFERENCES.highContrast,
    };
  } catch {
    return DEFAULT_UI_PREFERENCES;
  }
}

export function applyUiPreferences(preferences: UiPreferences) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.motion = preferences.reducedMotion ? "reduce" : "default";
  document.documentElement.dataset.contrast = preferences.highContrast ? "high" : "default";
}

export function persistUiPreferences(preferences: UiPreferences) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(UI_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}
