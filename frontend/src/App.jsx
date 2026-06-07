import React, { useState, useEffect } from 'react';
import './index.css';
import Overview  from './pages/Overview';
import Teams     from './pages/Teams';
import Players   from './pages/Players';
import Upcoming  from './pages/Upcoming';
import Predictor from './pages/Predictor';
import LiveScores from './pages/LiveScores';
import Login     from './pages/Login';
import Register  from './pages/Register';
import { triggerSync, getMe } from './api';

const TABS = [
  { id: 'live',      label: '🔴 Live'      },
  { id: 'overview',  label: '📊 Overview'  },
  { id: 'teams',     label: '⚔️ Teams'     },
  { id: 'players',   label: '🏅 Players'   },
  { id: 'upcoming',  label: '📅 Upcoming'  },
  { id: 'predictor', label: '🔮 Predictor' },
];

export default function App() {
  const [active, setActive] = useState('live');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncTrigger, setSyncTrigger] = useState(0);
  const [syncStatus, setSyncStatus] = useState(() => {
    return localStorage.getItem('lastSynced') || '';
  });

  // ── Auth State ─────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [authPage, setAuthPage] = useState('login'); // 'login' | 'register'
  const [authLoading, setAuthLoading] = useState(true);

  // Check existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      getMe()
        .then((res) => {
          setUser(res.data.user);
          setToken(storedToken);
        })
        .catch(() => {
          // Token expired or invalid
          localStorage.removeItem('token');
          setToken('');
          setUser(null);
        })
        .finally(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  // Handle login/register success
  const handleAuthSuccess = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setAuthPage('login');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await triggerSync();
      if (res.data && res.data.success) {
        const { newMatches } = res.data;
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const msg = `${newMatches} new matches synced @ ${nowStr}`;
        setSyncStatus(msg);
        localStorage.setItem('lastSynced', msg);
        setSyncTrigger(prev => prev + 1); // trigger state refresh in children
      }
    } catch (err) {
      console.error('Failed manual sync:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Auth Loading Screen ────────────────────────────────
  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="auth-logo">🏏</div>
          <div className="loading" style={{ padding: '1rem' }}>
            <div className="spinner"></div>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  // ── Not Authenticated → Show Login/Register ────────────
  if (!user || !token) {
    return authPage === 'login' ? (
      <Login onSwitch={() => setAuthPage('register')} onLogin={handleAuthSuccess} />
    ) : (
      <Register onSwitch={() => setAuthPage('login')} onLogin={handleAuthSuccess} />
    );
  }

  // ── Authenticated → Show Dashboard ─────────────────────
  const page = {
    live:      <LiveScores key={syncTrigger} />,
    overview:  <Overview key={syncTrigger} />,
    teams:     <Teams key={syncTrigger} />,
    players:   <Players key={syncTrigger} />,
    upcoming:  <Upcoming key={syncTrigger} />,
    predictor: <Predictor key={syncTrigger} />,
  }[active];

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <div className="header-logo">🏏</div>
          <div>
            <div className="header-title">Cricket Analytics</div>
            <div className="header-sub">IPL &amp; International Cricket</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {syncStatus && (
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
              {syncStatus}
            </span>
          )}
          <button
            className="sync-btn"
            onClick={handleSync}
            disabled={isSyncing}
            title="Sync latest live cricket data"
          >
            <span className={isSyncing ? 'sync-icon-spin' : ''} style={{ display: 'inline-block' }}>🔄</span>
            {isSyncing ? 'Syncing...' : 'Sync Data'}
          </button>
          
          <nav className="nav-tabs">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`nav-tab${active === t.id ? ' active' : ''}`}
                onClick={() => setActive(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <button
            className="theme-toggle"
            onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* User badge & Logout */}
          <div className="user-badge">
            <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span className="user-name">{user.name.split(' ')[0]}</span>
          </div>
          <button
            className="logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            Logout ↗
          </button>
        </div>
      </header>

      {/* Page content */}
      <main className="container">{page}</main>

      {/* Footer */}
      <footer style={{ textAlign: 'center', padding: '1.5rem', fontSize: 12, color: 'var(--muted)', borderTop: '1px solid var(--border)', background: 'var(--surface)', marginTop: 'auto' }}>
        Cricket Analytics Dashboard · IPL &amp; International Match Database
      </footer>
    </div>
  );
}
