import React, { useEffect, useState } from 'react';
import { getUpcoming } from '../api';
import { SportGenderFilter, MatchCard, Loading, ErrorBox } from '../components/UI';

export default function Upcoming() {
  const [gender,   setGender]   = useState('Men');
  const [league,   setLeague]   = useState('all');
  const [matches,  setMatches]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    const params = { sport: 'Cricket' };
    if (gender !== 'all') params.gender = gender;
    if (league !== 'all') params.league = league;
    setLoading(true);
    getUpcoming(params)
      .then(r => { setMatches(r.data); setError(''); })
      .catch(() => setError('Failed to load upcoming matches.'))
      .finally(() => setLoading(false));
  }, [gender, league]);

  if (loading) return <Loading />;
  if (error)   return <ErrorBox message={error} />;

  // Group by month
  const byMonth = {};
  matches.forEach(m => {
    const mo = new Date(m.date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    if (!byMonth[mo]) byMonth[mo] = [];
    byMonth[mo].push(m);
  });

  return (
    <div>
      <SportGenderFilter gender={gender} league={league} onGender={setGender} onLeague={setLeague} />

      <div style={{ display: 'flex', gap: 16, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div className="metric" style={{ flex: '1 1 120px' }}>
          <div className="metric-icon">📅</div>
          <div className="metric-label">Total Fixtures</div>
          <div className="metric-value">{matches.length}</div>
        </div>
        <div className="metric" style={{ flex: '1 1 120px' }}>
          <div className="metric-icon">🏏</div>
          <div className="metric-label">IPL / WPL</div>
          <div className="metric-value">{matches.filter(m => m.league.includes('Premier League')).length}</div>
        </div>
        <div className="metric" style={{ flex: '1 1 120px' }}>
          <div className="metric-icon">🌎</div>
          <div className="metric-label">International</div>
          <div className="metric-value">{matches.filter(m => m.league === 'International Cricket').length}</div>
        </div>
        <div className="metric" style={{ flex: '1 1 120px' }}>
          <div className="metric-icon">👨</div>
          <div className="metric-label">Men's</div>
          <div className="metric-value">{matches.filter(m => m.gender === 'Men').length}</div>
        </div>
        <div className="metric" style={{ flex: '1 1 120px' }}>
          <div className="metric-icon">👩</div>
          <div className="metric-label">Women's</div>
          <div className="metric-value">{matches.filter(m => m.gender === 'Women').length}</div>
        </div>
      </div>

      {matches.length === 0 ? (
        <p className="empty">No upcoming fixtures for the selected filters.</p>
      ) : (
        Object.entries(byMonth).map(([month, monthMatches]) => (
          <div key={month}>
            <div className="month-label">{month}</div>
            {monthMatches.map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        ))
      )}
    </div>
  );
}
