import "./Header.css";

function Header() {
  return (
    <header className="top-header">
      <div className="header-search">
        <span>⌕</span>
        <input type="search" placeholder="Search tasks..." />
      </div>

      <div className="header-actions">
        <button className="theme-button" aria-label="Theme settings">
          ◐
        </button>

        <div className="profile">
          <div className="profile-avatar">WK</div>
          <div className="profile-info">
            <strong>Weynshet</strong>
            <span>Team Member</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;