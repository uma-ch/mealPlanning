import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_URL } from '../config';
import '../styles/LoginPage.css';

export default function VerifyPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setError('No token provided');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to verify token');
        }

        const { token: jwtToken, user } = await response.json();

        // Store token and user in localStorage
        localStorage.setItem('token', jwtToken);
        localStorage.setItem('user', JSON.stringify(user));

        setStatus('success');

        // Redirect to home page after 1 second
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } catch (err: any) {
        setStatus('error');
        setError(err.message);
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div className="login-page">
      <div className="login-card">
        {status === 'verifying' && (
          <>
            <h1>Verifying...</h1>
            <p>Please wait while we sign you in.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h1>Success!</h1>
            <p>You've been signed in. Redirecting...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h1>Verification failed</h1>
            <p className="error-message">{error}</p>
            <button
              className="btn-primary"
              onClick={() => navigate('/login')}
            >
              Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
