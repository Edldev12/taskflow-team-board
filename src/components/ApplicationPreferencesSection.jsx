import { useState } from "react";
import { Accessibility, Rows3 } from "lucide-react";

const motionOptions = [
  {
    value: "system",
    label: "Follow device setting",
    description: "Use the reduced-motion preference set on your device.",
  },
  {
    value: "reduced",
    label: "Always reduce motion",
    description: "Minimize animations and transitions throughout TaskFlow.",
  },
];

function ApplicationPreferencesSection({
  preferences,
  onPreferencesChange,
}) {
  const [saveError, setSaveError] = useState("");

  function updatePreferences(nextPreferences) {
    if (!onPreferencesChange(nextPreferences)) {
      setSaveError("Your preference could not be saved. Please try again.");
      return;
    }

    setSaveError("");
  }

  function handleCompactTaskCardsChange(event) {
    updatePreferences({
      ...preferences,
      compactTaskCards: event.target.checked,
    });
  }

  function handleMotionPreferenceChange(event) {
    updatePreferences({
      ...preferences,
      motionPreference: event.target.value,
    });
  }

  return (
    <section
      className="settings-preferences-section"
      aria-labelledby="application-preferences-title"
    >
      <header className="settings-section-heading">
        <div className="settings-section-icon" aria-hidden="true">
          <Accessibility size={21} />
        </div>
        <div>
          <h2 id="application-preferences-title">Application Preferences</h2>
          <p>Adjust task density and motion to suit your workflow.</p>
        </div>
      </header>

      <div className="application-preferences-grid">
        <article
          className="application-preference-card"
          aria-labelledby="task-organization-title"
        >
          <div className="application-preference-heading">
            <div className="application-preference-icon" aria-hidden="true">
              <Rows3 size={19} />
            </div>
            <h3 id="task-organization-title">Task organization</h3>
          </div>
          <p className="application-preference-description">
            Choose how much space task cards use in each board column.
          </p>
          <label className="settings-preference-switch">
            <span className="settings-preference-switch-copy">
              <strong>Compact task cards</strong>
              <span>Reduce card spacing to show more tasks at once.</span>
            </span>
            <input
              type="checkbox"
              checked={preferences.compactTaskCards}
              onChange={handleCompactTaskCardsChange}
              aria-label="Compact task cards"
              aria-describedby="compact-task-cards-state"
            />
            <span className="settings-switch-track" aria-hidden="true">
              <span />
            </span>
            <span
              className="settings-preference-state"
              id="compact-task-cards-state"
              aria-live="polite"
            >
              {preferences.compactTaskCards ? "On" : "Off"}
            </span>
          </label>
        </article>

        <article
          className="application-preference-card"
          aria-labelledby="reduced-motion-title"
        >
          <div className="application-preference-heading">
            <div className="application-preference-icon" aria-hidden="true">
              <Accessibility size={19} />
            </div>
            <h3 id="reduced-motion-title">Reduced motion</h3>
          </div>
          <p className="application-preference-description">
            Reduce interface movement or follow your device&apos;s accessibility
            setting.
          </p>
          <fieldset className="settings-motion-options">
            <legend className="visually-hidden">Motion preference</legend>
            {motionOptions.map(({ value, label, description }) => (
              <label
                className="settings-motion-option"
                key={value}
                data-selected={preferences.motionPreference === value}
              >
                <input
                  type="radio"
                  name="motion-preference"
                  value={value}
                  checked={preferences.motionPreference === value}
                  onChange={handleMotionPreferenceChange}
                />
                <span className="settings-motion-option-copy">
                  <strong>{label}</strong>
                  <span>{description}</span>
                </span>
                {preferences.motionPreference === value && (
                  <span className="settings-theme-selected">Selected</span>
                )}
              </label>
            ))}
          </fieldset>
          <p className="settings-preference-current" role="status" aria-live="polite">
            Selected:{" "}
            <strong>
              {preferences.motionPreference === "reduced"
                ? "Always reduce motion"
                : "Follow device setting"}
            </strong>
          </p>
        </article>
      </div>

      {saveError && (
        <p className="settings-preferences-error" role="alert">
          {saveError}
        </p>
      )}
    </section>
  );
}

export default ApplicationPreferencesSection;
