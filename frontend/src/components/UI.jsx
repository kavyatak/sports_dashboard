import React from 'react';
import { COLORS, short } from '../utils';

// ── MetricCard ────────────────────────────────────────
export function MetricCard({ icon, label, value, sub }) {
  return (
    <div className="metric">
      <div className="metric-icon">{icon}</div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

// ── FilterBar ─────────────────────────────────────────
export function FilterBar({ sport, gender, onSport, onGender, extras }) {
  return (
    <div className="filters">
      <span className="filter-label">Sport</span>
      <select value={sport} onChange={e => onSport(e.target.value)}>
        <option value="all">All Sports</option>
        <option value="Cricket">Cricket</option>
        <option value="Football">Football</option>
      </select>
      <span className="filter-label">Gender</span>
      <select value={gender} onChange={e => onGender(e.target.value)}>
        <option value="all">All</option>
        <option value="Men">Men</option>
        <option value="Women">Women</option>
      </select>
      {extras}
    </div>
  );
}

// ── SportGenderFilter (Cricket-only) ──────────────────
export function SportGenderFilter({ gender, league, onGender, onLeague }) {
  const leagues = gender === 'Women'
    ? ['Womens Premier League', 'International Cricket']
    : ['Indian Premier League', 'International Cricket'];

  return (
    <div className="filters">
      <span className="filter-label">Category</span>
      <select value={gender} onChange={e => { onGender(e.target.value); onLeague('all'); }}>
        <option value="Men">Men's Cricket</option>
        <option value="Women">Women's Cricket</option>
      </select>
      <span className="filter-label">League</span>
      <select value={league} onChange={e => onLeague(e.target.value)}>
        <option value="all">All Leagues</option>
        {leagues.map(l => <option key={l} value={l}>{l}</option>)}
      </select>
    </div>
  );
}

// ── HorizontalBar ─────────────────────────────────────
export function HorizontalBar({ name, value, max, color }) {
  return (
    <div className="bar-row">
      <span className="bar-name" title={name}>{short(name, 20)}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${Math.round(value / max * 100)}%`, background: color }} />
      </div>
      <span className="bar-count">{value}</span>
    </div>
  );
}

// ── Badge ────────────────────────────────────────────
export function Badge({ sport, gender }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
      {sport  && <span className={`badge badge-${sport.toLowerCase()}`}>{sport}</span>}
      {gender && <span className={`badge badge-${gender.toLowerCase()}`}>{gender}</span>}
    </div>
  );
}

// ── MatchCard (upcoming) ──────────────────────────────
export function MatchCard({ match }) {
  const d = new Date(match.date);
  return (
    <div className="match-card">
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        <div className="match-date-box">
          <div className="match-date-day">{d.getDate()}</div>
          <div className="match-date-mon">{d.toLocaleDateString('en-GB', { month: 'short' })}</div>
        </div>
        <div className="match-main">
          <div className="match-teams">
            {match.teamA} <span className="match-vs">vs</span> {match.teamB}
          </div>
          <div className="match-venue">📍 {match.venue.split(',')[0]}</div>
        </div>
      </div>
      <Badge sport={match.sport} gender={match.gender} />
    </div>
  );
}

// ── LoadingSpinner ────────────────────────────────────
export function Loading() {
  return <div className="loading"><div className="spinner"></div>Loading data…</div>;
}

// ── ErrorBox ──────────────────────────────────────────
export function ErrorBox({ message }) {
  return <div className="error-box">⚠️ {message || 'Something went wrong. Is the backend running?'}</div>;
}

// ── Legend ────────────────────────────────────────────
export function Legend({ items }) {
  return (
    <div className="legend">
      {items.map((item, i) => (
        <span key={i} className="legend-item">
          <span className="legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
          {short(item, 22)}
        </span>
      ))}
    </div>
  );
}
