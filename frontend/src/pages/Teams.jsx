import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { getTeamStats, getH2H } from '../api';
import { SportGenderFilter, HorizontalBar, Loading, ErrorBox } from '../components/UI';
import { COLORS, short, CHART_DEFAULTS, AXIS_STYLE } from '../utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export default function Teams() {
  const [gender, setGender] = useState('Men');
  const [league, setLeague] = useState('all');
  const [teams,  setTeams]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // H2H state
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [h2h,   setH2H]   = useState(null);
  const [h2hLoading, setH2HLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = { sport: 'Cricket', gender };
    if (league !== 'all') params.league = league;
    getTeamStats(params)
      .then(r => { setTeams(r.data); setError(''); })
      .catch(() => setError('Failed to load team data.'))
      .finally(() => setLoading(false));
    setH2H(null);
  }, [gender, league]);

  const allTeamNames = teams.map(t => t.team);

  function compare() {
    if (!teamA || !teamB || teamA === teamB) return;
    setH2HLoading(true);
    const params = { teamA, teamB, sport: 'Cricket', gender };
    if (league !== 'all') params.league = league;
    getH2H(params)
      .then(r => setH2H(r.data))
      .catch(() => setH2H(null))
      .finally(() => setH2HLoading(false));
  }

  if (loading) return <Loading />;
  if (error)   return <ErrorBox message={error} />;

  const max = teams[0]?.wins || 1;

  const winRateData = {
    labels: teams.slice(0,10).map(t => short(t.team)),
    datasets: [{
      label: 'Win Rate %',
      data: teams.slice(0,10).map(t => t.winRate),
      backgroundColor: teams.slice(0,10).map((_,i) => COLORS[i % COLORS.length]),
      borderRadius: 0,
      borderWidth: 2,
      borderColor: '#0f172a',
    }],
  };

  return (
    <div>
      <SportGenderFilter gender={gender} league={league} onGender={setGender} onLeague={setLeague} />

      <div className="grid-2">
        <div className="card">
          <div className="card-title">📊 Team Win Rankings</div>
          {teams.slice(0, 12).map((t, i) => (
            <HorizontalBar key={t.team} name={t.team} value={t.wins} max={max} color={COLORS[i % COLORS.length]} />
          ))}
        </div>
        <div className="card">
          <div className="card-title">📈 Win Rate % (Top 10)</div>
          <div className="chart-wrap" style={{ height: 300 }}>
            <Bar data={winRateData} options={{ ...CHART_DEFAULTS, scales: { x: { ...AXIS_STYLE, grid: { display: false }, ticks: { ...AXIS_STYLE.ticks, maxRotation: 35 } }, y: { ...AXIS_STYLE, max: 100 } } }} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">⚔️ Head-to-Head Comparison</div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <select className="filter-select" value={teamA} onChange={e => setTeamA(e.target.value)}>
            <option value="">Select Team A</option>
            {allTeamNames.map(t => <option key={t}>{t}</option>)}
          </select>
          <span style={{ fontWeight: 700, color: 'var(--muted)' }}>vs</span>
          <select className="filter-select" value={teamB} onChange={e => setTeamB(e.target.value)}>
            <option value="">Select Team B</option>
            {allTeamNames.map(t => <option key={t}>{t}</option>)}
          </select>
          <button className="btn btn-primary" onClick={compare}>Compare</button>
        </div>

        {h2hLoading && <Loading />}

        {h2h && !h2hLoading && (
          h2h.total === 0 ? (
            <p className="empty">No head-to-head matches found between these teams.</p>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
                <div style={{ textAlign: 'center', background: 'var(--accent-light)', borderRadius: 'var(--radius)', padding: '16px', border: '3px solid var(--border)', boxShadow: '2px 2px 0 var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--border)', marginBottom: 4, textTransform: 'uppercase' }}>{short(h2h.teamA, 18)}</div>
                  <div style={{ fontSize: 42, fontWeight: 900, color: 'var(--accent-alt)' }}>{h2h.winsA}</div>
                  <div style={{ fontSize: 14, color: 'var(--border)', fontWeight: 700 }}>{h2h.pctA}% wins</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--muted)' }}>{h2h.total}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>matches</div>
                </div>
                <div style={{ textAlign: 'center', background: 'var(--accent-light)', borderRadius: 'var(--radius)', padding: '16px', border: '3px solid var(--border)', boxShadow: '2px 2px 0 var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--border)', marginBottom: 4, textTransform: 'uppercase' }}>{short(h2h.teamB, 18)}</div>
                  <div style={{ fontSize: 42, fontWeight: 900, color: 'var(--accent)' }}>{h2h.winsB}</div>
                  <div style={{ fontSize: 14, color: 'var(--border)', fontWeight: 700 }}>{h2h.pctB}% wins</div>
                </div>
              </div>
              <div className="h2h-bar">
                <div style={{ width: `${h2h.pctA}%`, background: 'var(--accent-alt)' }} />
                <div style={{ width: `${h2h.pctB}%`, background: 'var(--accent)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--border)', marginTop: 8 }}>
                <span style={{ color: 'var(--accent-alt)', fontWeight: 900, textTransform: 'uppercase' }}>{short(h2h.teamA, 16)}</span>
                <span style={{ color: 'var(--accent)', fontWeight: 900, textTransform: 'uppercase' }}>{short(h2h.teamB, 16)}</span>
              </div>
            </div>
          )
        )}
      </div>

      {/* Team Details Table */}
      <div className="card">
        <div className="card-title">📋 Full Team Stats</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['#','Team','Wins','Losses','Matches','Win Rate','Avg Score'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--muted)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teams.map((t, i) => (
                <tr key={t.team} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 12px', color: 'var(--muted)', fontWeight: 700 }}>{i+1}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{t.team}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--accent-alt)', fontWeight: 900 }}>{t.wins}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--accent)', fontWeight: 900 }}>{t.losses}</td>
                  <td style={{ padding: '10px 12px' }}>{t.matches}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: t.winRate > 50 ? '#a3e635' : '#fee2e2', color: 'var(--border)', padding: '4px 10px', border: '2px solid var(--border)', fontSize: 12, fontWeight: 900, textTransform: 'uppercase' }}>{t.winRate}%</span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>{t.avgScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
