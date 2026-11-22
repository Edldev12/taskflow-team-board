import { Bell } from "lucide-react";
import "./Header.css";

function Header({ profile }) {
  return (
    <header className="top-header">
      <div className="header-search">
        <span className="search-icon">⌕</span>
        <input type="search" placeholder="Search tasks..." aria-label="Search tasks" />
      </div>

      <div className="header-actions">
        <select className="label-filter" defaultValue="all">
          <option value="all">All Labels</option>
          <option value="design">Design</option>
          <option value="frontend">Frontend</option>
          <option value="planning">Planning</option>
          <option value="development">Development</option>
        </select>

        <button className="notification-button" aria-label="Notifications">
  <Bell size={23} strokeWidth={1.8} />
  <span className="notification-count">2</span>
</button>

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
