import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  householdId: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Check for existing session
    const checkAuth = async () => {
      try {
        // DEVELOPMENT MODE: Auto-login with mock user
        // Remove this in production and implement real auth
        const mockUser: User = {
          id: 'dev-user-1',
          email: 'dev@example.com',
          householdId: 'dev-household-1',
        };
        setUser(mockUser);
        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email: string) => {
    // TODO: Implement magic link login
    console.log('Login with:', email);
  };

  const logout = () => {
    setUser(null);
    // TODO: Clear session
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
