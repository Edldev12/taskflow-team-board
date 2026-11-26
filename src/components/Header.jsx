import { Bell, Moon, Sun, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./Header.css";

function Header({
  profile,
  theme,
  onThemeChange,
  searchQuery,
  onSearchQueryChange,
  notifications,
  onNotificationsRead,
}) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationWrapperRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  useEffect(() => {
    if (!isNotificationsOpen) return undefined;

    function handleDocumentClick(event) {
      if (!notificationWrapperRef.current?.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsNotificationsOpen(false);
        notificationButtonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleDocumentClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isNotificationsOpen]);

  function toggleNotifications() {
    const willOpen = !isNotificationsOpen;
    setIsNotificationsOpen(willOpen);
    if (willOpen) onNotificationsRead();
  }

  return (
    <header className="top-header">
      <div className="header-search" role="search" aria-label="Task search">
        <span className="search-icon">⌕</span>
        <input
          type="search"
          placeholder="Search tasks..."
          aria-label="Search tasks"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
        />
        {searchQuery && (
          <button
            type="button"
            className="header-search-clear"
            aria-label="Clear task search"
            onClick={() => onSearchQueryChange("")}
          >
            <X size={16} aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="header-actions">
        <div className="header-theme-controls" role="group" aria-label="Theme">
          <button
            className="header-theme-button"
            type="button"
            aria-label="Light mode"
            title="Light mode"
            aria-pressed={theme === "light"}
            onClick={() => onThemeChange("light")}
          >
            <Sun size={19} aria-hidden="true" />
          </button>
          <button
            className="header-theme-button"
            type="button"
            aria-label="Dark mode"
            title="Dark mode"
            aria-pressed={theme === "dark"}
            onClick={() => onThemeChange("dark")}
          >
            <Moon size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="notification-wrapper" ref={notificationWrapperRef}>
          <button
            ref={notificationButtonRef}
            className="notification-button"
            type="button"
            aria-label={
              unreadCount
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
            aria-expanded={isNotificationsOpen}
            aria-controls="notification-panel"
            onClick={toggleNotifications}
          >
            <Bell size={23} strokeWidth={1.8} aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="notification-count" aria-hidden="true">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {isNotificationsOpen && (
            <section
              className="notification-panel"
              id="notification-panel"
              aria-label="Notifications"
            >
              <div className="notification-panel-header">
                <h2>Notifications</h2>
                <span>{notifications.length} recent</span>
              </div>
              {notifications.length > 0 ? (
                <ul className="notification-list">
                  {notifications.map((notification) => (
                    <li className="notification-item" key={notification.id}>
                      <span className="notification-item-dot" aria-hidden="true" />
                      <div>
                        <p>{notification.message}</p>
                        <time dateTime={notification.createdAt}>
                          {new Intl.DateTimeFormat(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(notification.createdAt))}
                        </time>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="notification-empty">You're all caught up.</p>
              )}
            </section>
          )}
        </div>

        <div className="header-profile">
          <div
            className="profile-avatar"
            role="img"
            aria-label={`${profile.initials} profile initials`}
          >
            {profile.initials}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
