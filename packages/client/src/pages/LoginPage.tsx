import { useState } from 'react';
import { API_URL } from '../config';
import '../styles/LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send magic link');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>Check your email</h1>
          <p>We've sent a magic link to <strong>{email}</strong></p>
          <p className="hint">Click the link in the email to sign in. The link will expire in 15 minutes.</p>
          <button
            className="btn-secondary"
            onClick={() => {
              setSubmitted(false);
              setEmail('');
            }}
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Welcome to Recipe Planner</h1>
        <p className="subtitle">Sign in with your email to get started</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn-primary" disabled={loading || !email}>
            {loading ? 'Sending...' : 'Send magic link'}
          </button>
        </form>

        <p className="hint">
          We'll send you a magic link to sign in. No password needed!
        </p>
      </div>
    </div>
  );
}
