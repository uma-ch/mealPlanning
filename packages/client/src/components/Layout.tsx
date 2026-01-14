import { Outlet, NavLink } from 'react-router-dom';
import { getUser, removeToken } from '../utils/auth';
import { useNavigate } from 'react-router-dom';

export default function Layout() {
  const user = getUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <nav className="main-nav">
        <div className="nav-links">
          <NavLink to="/recipes">Recipes</NavLink>
          <NavLink to="/calendar">Calendar</NavLink>
          <NavLink to="/grocery-list">Grocery List</NavLink>
          <NavLink to="/household">Household</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </div>
        {user && (
          <div className="nav-user">
            <span className="user-email">{user.email}</span>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        )}
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
