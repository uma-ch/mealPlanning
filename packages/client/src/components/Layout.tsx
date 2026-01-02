import { Outlet, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <nav className="main-nav">
        <NavLink to="/recipes">Recipes</NavLink>
        <NavLink to="/calendar">Calendar</NavLink>
        <NavLink to="/grocery-list">Grocery List</NavLink>
        <NavLink to="/settings">Settings</NavLink>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
