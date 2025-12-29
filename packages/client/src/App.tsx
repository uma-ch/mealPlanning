import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HouseholdProvider } from './contexts/HouseholdContext';
import RecipesPage from './pages/RecipesPage';
import CalendarPage from './pages/CalendarPage';
import GroceryListPage from './pages/GroceryListPage';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';

function App() {
  return (
    <AuthProvider>
      <HouseholdProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Navigate to="/recipes" replace />} />
              <Route path="recipes" element={<RecipesPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="grocery-list" element={<GroceryListPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </HouseholdProvider>
    </AuthProvider>
  );
}

export default App;
