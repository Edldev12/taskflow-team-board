import { useEffect, useRef } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import ProfileInformationSection from "./ProfileInformationSection";
import "./SettingsPage.css";

const themeOptions = [
  {
    value: "light",
    label: "Light Mode",
    description: "A bright workspace with white cards and blue accents.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark Mode",
    description: "A low-light workspace with dark surfaces and readable contrast.",
    icon: Moon,
  },
  {
    value: "system",
    label: "Use device preference",
    description: "Automatically match your device's light or dark setting.",
    icon: Monitor,
  },
];

function SettingsPage({
  theme,
  themePreference,
  onThemePreferenceChange,
  profile,
  onSaveProfile,
}) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section
      className="dashboard-content settings-page"
      id="settings"
      aria-labelledby="settings-title"
    >
      <header className="dashboard-heading">
        <div>
          <h1 id="settings-title" ref={headingRef} tabIndex="-1">
            Settings
          </h1>
          <p>Personalize how TaskFlow looks on your device.</p>
        </div>
      </header>

      <section
        className="settings-appearance-section"
        aria-labelledby="settings-appearance-title"
      >
        <header className="settings-section-heading">
          <div className="settings-section-icon" aria-hidden="true">
            <Sun size={21} />
          </div>
          <div>
            <h2 id="settings-appearance-title">Appearance</h2>
            <p>Choose the theme that feels right for your workspace.</p>
          </div>
        </header>

        <div className="settings-theme-options" role="group" aria-label="Theme preference">
          {themeOptions.map(({ value, label, description, icon: Icon }) => (
            <button
              key={value}
              className="settings-theme-option"
              type="button"
              aria-pressed={themePreference === value}
              onClick={() => onThemePreferenceChange(value)}
            >
              <span className="settings-theme-icon" aria-hidden="true">
                <Icon size={22} />
              </span>
              <span className="settings-theme-copy">
                <strong>{label}</strong>
                <span>{description}</span>
              </span>
              {themePreference === value && (
                <span className="settings-theme-selected">Selected</span>
              )}
            </button>
          ))}
        </div>

        <p className="settings-theme-status" role="status" aria-live="polite">
          Currently active: <strong>{theme === "dark" ? "Dark Mode" : "Light Mode"}</strong>
          {themePreference === "system"
            ? " — following your device preference."
            : " — set by your selection."}
        </p>
      </section>

      <ProfileInformationSection
        profile={profile}
        onSaveProfile={onSaveProfile}
      />
    </section>
  );
}

export default SettingsPage;
