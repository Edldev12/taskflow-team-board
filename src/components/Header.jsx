import { Bell } from "lucide-react";
import "./Header.css";

function Header() {
  return (
    <header className="top-header">
      <div className="header-search">
        <span className="search-icon">⌕</span>
        <input type="search" placeholder="Search tasks..." />
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
          <div className="profile-avatar">WK</div>
        </div>
      </div>
    </header>
  );
}

export default Header;
