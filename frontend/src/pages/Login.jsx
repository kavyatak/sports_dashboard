import React, { useState } from 'react';

export default function Login({ onSwitch, onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const { login } = await import('../api');
      const res = await login({ email, password });
      onLogin(res.data.token, res.data.user);
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      setError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  return (
    <div className="auth-page">
      {/* Floating decorative elements */}
      <div className="auth-decor auth-decor-1">🏏</div>
      <div className="auth-decor auth-decor-2">⚾</div>
      <div className="auth-decor auth-decor-3">🏆</div>
      <div className="auth-decor auth-decor-4">⚽</div>

      <div className={`auth-card ${shake ? 'shake' : ''}`}>
        {/* Logo */}
        <div className="auth-logo">🏏</div>
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your Cricket Analytics dashboard</p>

        {error && (
          <div className="auth-error">
            <span className="auth-error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">Email</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">📧</span>
              <input
                id="login-email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input
                id="login-password"
                type="password"
                className="auth-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="auth-btn-spinner"></span>
                Signing In...
              </>
            ) : (
              'Login →'
            )}
          </button>
        </form>

        <div className="auth-toggle">
          Don't have an account?{' '}
          <button className="auth-toggle-link" onClick={onSwitch}>
            Create one
          </button>
        </div>

        <div className="auth-footer-badge">
          <span>🏆</span> Cricket Analytics Dashboard
        </div>
      </div>
    </div>
  );
}
