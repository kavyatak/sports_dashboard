import React, { useState, useMemo } from 'react';

export default function Register({ onSwitch, onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password strength calculator
  const strength = useMemo(() => {
    if (!password) return { level: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: '#ef4444' };
    if (score <= 2) return { level: 2, label: 'Fair', color: '#f59e0b' };
    if (score <= 3) return { level: 3, label: 'Good', color: '#f97316' };
    if (score <= 4) return { level: 4, label: 'Strong', color: '#10b981' };
    return { level: 5, label: 'Excellent', color: '#10b981' };
  }, [password]);

  const passwordsMatch = confirmPassword && password === confirmPassword;
  const passwordsMismatch = confirmPassword && password !== confirmPassword;

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      triggerShake();
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      triggerShake();
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const { register } = await import('../api');
      const res = await register({ name, email, password });

      // Show success animation
      setSuccess(true);
      setTimeout(() => {
        onLogin(res.data.token, res.data.user);
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(msg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-success-card">
          <div className="auth-success-icon">🎉</div>
          <h2 className="auth-title">Account Created!</h2>
          <p className="auth-subtitle">Welcome to Cricket Analytics. Redirecting...</p>
          <div className="auth-success-bar">
            <div className="auth-success-bar-fill"></div>
          </div>
        </div>
      </div>
    );
  }

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
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join the Cricket Analytics community</p>

        {error && (
          <div className="auth-error">
            <span className="auth-error-icon">⚠️</span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label" htmlFor="register-name">Full Name</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">👤</span>
              <input
                id="register-name"
                type="text"
                className="auth-input"
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="register-email">Email</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">📧</span>
              <input
                id="register-email"
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
            <label className="auth-label" htmlFor="register-password">Password</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <input
                id="register-password"
                type="password"
                className="auth-input"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {password && (
              <div className="password-strength">
                <div className="password-strength-track">
                  <div
                    className="password-strength-fill"
                    style={{ width: `${(strength.level / 5) * 100}%`, background: strength.color }}
                  ></div>
                </div>
                <span className="password-strength-label" style={{ color: strength.color }}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="register-confirm">Confirm Password</label>
            <div className={`auth-input-wrap ${passwordsMatch ? 'auth-input-valid' : ''} ${passwordsMismatch ? 'auth-input-invalid' : ''}`}>
              <span className="auth-input-icon">{passwordsMatch ? '✅' : passwordsMismatch ? '❌' : '🔒'}</span>
              <input
                id="register-confirm"
                type="password"
                className="auth-input"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="auth-btn-spinner"></span>
                Creating Account...
              </>
            ) : (
              'Register →'
            )}
          </button>
        </form>

        <div className="auth-toggle">
          Already have an account?{' '}
          <button className="auth-toggle-link" onClick={onSwitch}>
            Sign in
          </button>
        </div>

        <div className="auth-footer-badge">
          <span>🏆</span> Cricket Analytics Dashboard
        </div>
      </div>
    </div>
  );
}
