const STORAGE_KEY = "taskflow-team-board.profile";

export const DEFAULT_PROFILE = Object.freeze({
  fullName: "Weynshet",
  email: "",
  initials: "WK",
});

export function getProfileInitials(fullName) {
  const initials = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase();

  return initials || "U";
}

export function loadProfile() {
  try {
    const storedProfile = window.localStorage.getItem(STORAGE_KEY);
    if (storedProfile === null) return { ...DEFAULT_PROFILE };

    const profile = JSON.parse(storedProfile);
    if (
      !profile ||
      typeof profile.fullName !== "string" ||
      !profile.fullName.trim() ||
      typeof profile.email !== "string" ||
      typeof profile.initials !== "string"
    ) {
      throw new Error("Saved profile information is invalid.");
    }

    const initials = profile.initials.trim().toUpperCase();
    return {
      fullName: profile.fullName.trim(),
      email: profile.email.trim(),
      initials: /^[A-Z]{1,3}$/.test(initials)
        ? initials
        : getProfileInitials(profile.fullName),
    };
  } catch (error) {
    console.error("Unable to restore the saved profile.", error);
    return { ...DEFAULT_PROFILE };
  }
}

export function saveProfile(profile) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.error("Unable to save the profile.", error);
    return false;
  }
}
