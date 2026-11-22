const STORAGE_KEY = "taskflow-team-board.application-preferences";

export const DEFAULT_APPLICATION_PREFERENCES = Object.freeze({
  compactTaskCards: false,
  motionPreference: "system",
});

export function loadApplicationPreferences() {
  try {
    const storedPreferences = window.localStorage.getItem(STORAGE_KEY);
    if (storedPreferences === null) {
      return { ...DEFAULT_APPLICATION_PREFERENCES };
    }

    const preferences = JSON.parse(storedPreferences);
    if (
      !preferences ||
      typeof preferences.compactTaskCards !== "boolean" ||
      !["system", "reduced"].includes(preferences.motionPreference)
    ) {
      throw new Error("Saved application preferences are invalid.");
    }

    return {
      compactTaskCards: preferences.compactTaskCards,
      motionPreference: preferences.motionPreference,
    };
  } catch (error) {
    console.error("Unable to restore application preferences.", error);
    return { ...DEFAULT_APPLICATION_PREFERENCES };
  }
}

export function saveApplicationPreferences(preferences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error("Unable to save application preferences.", error);
    return false;
  }
}
