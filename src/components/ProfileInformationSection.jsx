import { useEffect, useRef, useState } from "react";
import { Mail, Pencil, UserRound } from "lucide-react";
import { getProfileInitials } from "../utils/profileStorage";

function ProfileInformationSection({ profile, onSaveProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState(profile);
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");
  const fullNameInputRef = useRef(null);

  useEffect(() => {
    if (isEditing) fullNameInputRef.current?.focus();
  }, [isEditing]);

  function startEditing() {
    setFormValues({
      fullName: profile.fullName,
      email: profile.email,
      initials: profile.initials,
      role: profile.role,
    });
    setErrors({});
    setSaveError("");
    setSavedMessage("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setFormValues(profile);
    setErrors({});
    setSaveError("");
    setIsEditing(false);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({ ...currentValues, [name]: value }));
    setErrors((currentErrors) => {
      const nextErrors = { ...currentErrors };
      delete nextErrors[name];
      return nextErrors;
    });
    setSaveError("");
  }

  function handleSubmit(event) {
    event.preventDefault();
    const fullName = formValues.fullName.trim();
    const email = formValues.email.trim();
    const enteredInitials = formValues.initials.trim().replace(/\s+/g, "");
    const nextErrors = {};

    if (!fullName) {
      nextErrors.fullName = "Enter your full name.";
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "Enter a valid email address, or leave this field blank.";
    }

    if (enteredInitials && !/^[a-z]{1,3}$/i.test(enteredInitials)) {
      nextErrors.initials = "Use one to three letters for your initials.";
    }

    setErrors(nextErrors);
    setSaveError("");
    setSavedMessage("");
    if (Object.keys(nextErrors).length > 0) return;

    const updatedProfile = {
      ...profile,
      fullName,
      email,
      initials: enteredInitials.toUpperCase() || getProfileInitials(fullName),
    };

    if (!onSaveProfile(updatedProfile)) {
      setSaveError("Your profile could not be saved. Please try again.");
      return;
    }

    setIsEditing(false);
    setSavedMessage("Profile information saved.");
  }

  return (
    <section
      className="settings-profile-section"
      aria-labelledby="settings-profile-title"
    >
      <header className="settings-section-heading">
        <div className="settings-section-icon" aria-hidden="true">
          <UserRound size={21} />
        </div>
        <div>
          <h2 id="settings-profile-title">Profile Information</h2>
        </div>
      </header>

      {isEditing ? (
        <form className="settings-profile-form" onSubmit={handleSubmit} noValidate>
          <div className="settings-profile-fields">
            <div className="settings-profile-field">
              <label htmlFor="profile-full-name">Full Name <span aria-hidden="true">*</span></label>
              <input
                ref={fullNameInputRef}
                id="profile-full-name"
                name="fullName"
                type="text"
                autoComplete="name"
                value={formValues.fullName}
                onChange={handleChange}
                required
                aria-required="true"
                aria-invalid={Boolean(errors.fullName)}
                aria-describedby={errors.fullName ? "profile-validation-errors" : undefined}
              />
            </div>

            <div className="settings-profile-field">
              <label htmlFor="profile-email">Email Address <span>(optional)</span></label>
              <input
                id="profile-email"
                name="email"
                type="email"
                autoComplete="email"
                value={formValues.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "profile-validation-errors" : undefined}
              />
            </div>

            <div className="settings-profile-field">
              <label htmlFor="profile-initials">Avatar Initials <span>(optional)</span></label>
              <input
                id="profile-initials"
                name="initials"
                type="text"
                autoComplete="off"
                maxLength={3}
                value={formValues.initials}
                onChange={handleChange}
                aria-invalid={Boolean(errors.initials)}
                aria-describedby={errors.initials ? "profile-validation-errors" : undefined}
              />
              <span className="settings-profile-hint">
                Leave blank to use initials from your name.
              </span>
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div
              className="settings-profile-errors"
              id="profile-validation-errors"
              role="alert"
            >
              <p>Please fix the following before saving:</p>
              <ul>
                {Object.values(errors).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {saveError && (
            <p className="settings-profile-errors" role="alert">
              {saveError}
            </p>
          )}

          <div className="settings-profile-actions">
            <button className="settings-primary-button" type="submit">
              Save Changes
            </button>
            <button
              className="settings-secondary-button"
              type="button"
              onClick={cancelEditing}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="settings-profile-summary">
          <div
            className="settings-profile-avatar"
            role="img"
            aria-label={`${profile.initials} profile initials`}
          >
            {profile.initials}
          </div>
          <div className="settings-profile-details">
            <h3>{profile.fullName}</h3>
            <div className="settings-profile-email">
              <Mail size={16} aria-hidden="true" />
              <span>{profile.email || "Email not provided"}</span>
            </div>
          </div>
          <button
            className="settings-secondary-button settings-edit-profile-button"
            type="button"
            onClick={startEditing}
          >
            <Pencil size={16} aria-hidden="true" />
            Edit Profile
          </button>
        </div>
      )}

      {savedMessage && (
        <p className="settings-profile-saved" role="status" aria-live="polite">
          {savedMessage}
        </p>
      )}
    </section>
  );
}

export default ProfileInformationSection;
