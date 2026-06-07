import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getLive, getCredits } from '../api';
import { Loading, ErrorBox } from '../components/UI';

const REFRESH_INTERVAL = 60; // seconds

/* ── Helpers ─────────────────────────────────────────── */
function categorize(status) {
  const s = (status || '').toLowerCase();
  if (s.includes('not started')) return 'upcoming';
  if (s.includes('won') || s.includes('drawn') || s.includes('tied')) return 'completed';
  // Anything in-progress or with live keywords
  if (
    s.includes('started') || s.includes('innings') || s.includes('need') ||
    s.includes('trail') || s.includes('lead') || s.includes('opt') ||
    s.includes('break')
  ) return 'live';
  // Default: if it's not completed and not upcoming, treat as live
  return 'live';
}

function formatInning(sc) {
  if (!sc) return null;
  return `${sc.r}/${sc.w} (${sc.o})`;
}

function matchTypeBadge(type) {
  const t = (type || '').toLowerCase();
  if (t === 't20') return { label: 'T20', cls: 'match-type-t20' };
  if (t === 'odi') return { label: 'ODI', cls: 'match-type-odi' };
  if (t === 'test') return { label: 'TEST', cls: 'match-type-test' };
  return { label: type?.toUpperCase() || '—', cls: '' };
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

/* ══════════════════════════════════════════════════════
   LiveScores Page
   ══════════════════════════════════════════════════════ */
export default function LiveScores() {
  const [matches, setMatches]     = useState([]);
  const [credits, setCredits]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const timerRef = useRef(null);
  const countdownRef = useRef(null);

  /* ── Fetch data ──────────────────────────────────── */
  const fetchData = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError('');
    try {
      const [liveRes, creditsRes] = await Promise.all([getLive(), getCredits()]);
      setMatches(Array.isArray(liveRes.data) ? liveRes.data : []);
      setCredits(creditsRes.data || null);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch live scores');
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Mount & auto-refresh ────────────────────────── */
  useEffect(() => {
    fetchData(true);

    // Auto-refresh timer
    timerRef.current = setInterval(() => {
      fetchData(false);
      setCountdown(REFRESH_INTERVAL);
    }, REFRESH_INTERVAL * 1000);

    // Countdown ticker
    countdownRef.current = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : REFRESH_INTERVAL));
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      clearInterval(countdownRef.current);
    };
  }, [fetchData]);

  /* ── Manual refresh ──────────────────────────────── */
  const handleRefresh = () => {
    setCountdown(REFRESH_INTERVAL);
    clearInterval(timerRef.current);
    fetchData(false);
    timerRef.current = setInterval(() => {
      fetchData(false);
      setCountdown(REFRESH_INTERVAL);
    }, REFRESH_INTERVAL * 1000);
  };

  /* ── Categorised buckets ─────────────────────────── */
  const live      = matches.filter(m => categorize(m.status) === 'live');
  const completed = matches.filter(m => categorize(m.status) === 'completed');
  const upcoming  = matches.filter(m => categorize(m.status) === 'upcoming');

  /* ── Render ──────────────────────────────────────── */
  if (loading) return <Loading />;
  if (error)   return <ErrorBox message={error} />;

  return (
    <div className="live-page">

      {/* ── Header bar ─────────────────────────────── */}
      <div className="live-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {credits && (
            <div className="credits-bar">
              {credits.configured === false ? (
                <span style={{ color: '#ef4444' }}>⚠ API key not configured</span>
              ) : (
                <>🔑 {credits.hitsToday ?? 0} / {credits.hitsLimit ?? 100} API hits used today</>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="refresh-countdown">
            ⏱ Refresh in <strong>{countdown}s</strong>
          </div>
          <button className="btn btn-primary" onClick={handleRefresh}>
            ↻ Refresh Now
          </button>
        </div>
      </div>

      {/* ── Live Matches ───────────────────────────── */}
      {live.length > 0 && (
        <>
          <div className="live-section-title">
            <span className="live-dot" /> Live Now — {live.length} match{live.length > 1 ? 'es' : ''}
          </div>
          {live.map(m => <LiveCard key={m.id} match={m} isLive />)}
        </>
      )}

      {/* ── Completed Matches ──────────────────────── */}
      {completed.length > 0 && (
        <>
          <div className="live-section-title">
            ✅ Completed — {completed.length} match{completed.length > 1 ? 'es' : ''}
          </div>
          {completed.map(m => <LiveCard key={m.id} match={m} />)}
        </>
      )}

      {/* ── Upcoming Matches ───────────────────────── */}
      {upcoming.length > 0 && (
        <>
          <div className="live-section-title">
            📅 Upcoming — {upcoming.length} match{upcoming.length > 1 ? 'es' : ''}
          </div>
          {upcoming.map(m => <LiveCard key={m.id} match={m} />)}
        </>
      )}

      {/* ── Empty state ────────────────────────────── */}
      {matches.length === 0 && (
        <div className="live-no-matches">
          🏏 No matches available right now. Check back soon!
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   LiveCard — individual match card
   ══════════════════════════════════════════════════════ */
function LiveCard({ match, isLive }) {
  const badge = matchTypeBadge(match.matchType);
  const scores = match.score || [];

  return (
    <div className={`live-card${isLive ? ' live-card-live' : ''}`}>
      {/* Top row: type badge + date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={`match-type-badge ${badge.cls}`}>{badge.label}</span>
          {isLive && <span className="live-dot" />}
        </div>
        <span className="live-date">{formatDate(match.date)}</span>
      </div>

      {/* Teams */}
      <div className="live-teams">
        {match.teams?.[0] || '—'}
        <span className="live-vs">VS</span>
        {match.teams?.[1] || '—'}
      </div>

      {/* Venue */}
      {match.venue && (
        <div className="live-venue">📍 {match.venue}</div>
      )}

      {/* Scores */}
      {scores.length > 0 && (
        <div className="live-score-innings">
          {scores.map((s, i) => (
            <div key={i} className="live-inning">
              <div className="live-inning-name">{s.inning || `Inning ${i + 1}`}</div>
              <div className="live-inning-score">{formatInning(s)}</div>
            </div>
          ))}
        </div>
      )}

      {/* Status */}
      <div className="live-status" style={isLive ? { color: '#f97316' } : undefined}>
        {match.status || '—'}
      </div>
    </div>
  );
}
