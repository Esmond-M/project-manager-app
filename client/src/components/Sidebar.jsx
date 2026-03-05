import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">⚡ ProjManager</div>
      <NavLink to="/dashboard">
        <span>📊</span> Dashboard
      </NavLink>
      <NavLink to="/projects">
        <span>📁</span> Projects
      </NavLink>

      <div className="sidebar-bottom">
        <div style={{ padding: '0 0.5rem 0.75rem', fontSize: '0.82rem', color: 'var(--color-muted)' }}>
          {user?.name}
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{ width: '100%', justifyContent: 'flex-start' }}
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  );
}
