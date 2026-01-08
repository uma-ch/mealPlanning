import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RecipesPage from './pages/RecipesPage';
import CalendarPage from './pages/CalendarPage';
import GroceryListPage from './pages/GroceryListPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import VerifyPage from './pages/VerifyPage';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/verify" element={<VerifyPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/recipes" replace />} />
          <Route path="recipes" element={<RecipesPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="grocery-list" element={<GroceryListPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
