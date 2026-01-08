import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setToken } from '../utils/auth';
import '../styles/LoginPage.css';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      if (error === 'auth_failed') {
        setErrorMessage('Authentication failed. Please try again.');
      } else {
        setErrorMessage('An error occurred during sign in. Please try again.');
      }
      return;
    }

    if (!token) {
      setStatus('error');
      setErrorMessage('No authentication token received.');
      return;
    }

    // Store token
    setToken(token);

    // Redirect to home
    setTimeout(() => {
      navigate('/');
    }, 500);
  }, [searchParams, navigate]);

  if (status === 'error') {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Sign In Failed</h1>
          <div className="error-message">{errorMessage}</div>
          <button
            className="btn-primary"
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Signing you in...</h1>
        <p className="hint">Please wait while we complete your sign in.</p>
      </div>
    </div>
  );
}
