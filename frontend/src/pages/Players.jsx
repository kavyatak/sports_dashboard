import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { getPlayerStats } from '../api';
import { SportGenderFilter, Loading, ErrorBox } from '../components/UI';
import { COLORS, short, CHART_DEFAULTS, AXIS_STYLE } from '../utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const RANK_COLORS = ['#f59e0b','#9ca3af','#b45309',...COLORS];

export default function Players() {
  const [gender,  setGender]  = useState('Men');
  const [league,  setLeague]  = useState('all');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    setLoading(true);
    const params = { sport: 'Cricket', gender };
    if (league !== 'all') params.league = league;
    getPlayerStats(params)
      .then(r => { setPlayers(r.data); setError(''); })
      .catch(() => setError('Failed to load player data.'))
      .finally(() => setLoading(false));
  }, [gender, league]);

  if (loading) return <Loading />;
  if (error)   return <ErrorBox message={error} />;

  const unit = 'runs';
  const top10 = players.slice(0, 10);
  const maxScore = top10[0]?.totalScore || 1;

  const barData = {
    labels: top10.map(p => p.player.split(' ').pop()),
    datasets: [{
      label: unit,
      data: top10.map(p => p.totalScore),
      backgroundColor: top10.map((_, i) => COLORS[i % COLORS.length]),
      borderRadius: 5,
    }],
  };

  const avgData = {
    labels: top10.map(p => p.player.split(' ').pop()),
    datasets: [{
      label: `Avg ${unit}`,
      data: top10.map(p => p.avgScore),
      backgroundColor: top10.map((_, i) => COLORS[i % COLORS.length] + 'aa'),
      borderRadius: 5,
    }],
  };

  return (
    <div>
      <SportGenderFilter gender={gender} league={league} onGender={setGender} onLeague={setLeague} />

      <div className="grid-2">
        {/* Leaderboard */}
        <div className="card">
          <div className="card-title">🏅 Top 10 Leaderboard</div>
          {top10.map((p, i) => (
            <div key={p.player} className="player-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="player-rank" style={{ background: RANK_COLORS[i] + '22', color: RANK_COLORS[i] }}>{i + 1}</div>
                <div>
                  <div className="player-name">{p.player}</div>
                  <div className="player-team">{p.team}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 60 }}>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.round(p.totalScore / maxScore * 100)}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                  </div>
                  <span className="player-score">{p.totalScore}<span className="player-unit"> {unit}</span></span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{p.matches} match{p.matches > 1 ? 'es' : ''}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Total score chart */}
        <div className="card">
          <div className="card-title">📊 Total {unit === 'runs' ? 'Runs' : 'Goals'} — Top 10</div>
          <div className="chart-wrap" style={{ height: 320 }}>
            <Bar data={barData} options={{ ...CHART_DEFAULTS, indexAxis: 'y', scales: { x: { ...AXIS_STYLE }, y: { ...AXIS_STYLE, grid: { display: false } } } }} />
          </div>
        </div>
      </div>

      {/* Avg score chart */}
      <div className="card">
        <div className="card-title">📈 Average Score Per Match — Top 10</div>
        <div className="chart-wrap" style={{ height: 240 }}>
          <Bar data={avgData} options={{ ...CHART_DEFAULTS, scales: { x: { ...AXIS_STYLE, grid: { display: false }, ticks: { ...AXIS_STYLE.ticks, maxRotation: 30 } }, y: { ...AXIS_STYLE } } }} />
        </div>
      </div>

      {/* Full table */}
      <div className="card">
        <div className="card-title">📋 Full Player Stats</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                {['#','Player','Team','Total','Matches','Avg / Match'].map(h => (
                  <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--muted)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {players.map((p, i) => (
                <tr key={p.player} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 12px', color: 'var(--muted)', fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>{p.player}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--muted)' }}>{short(p.team, 22)}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 900, color: 'var(--accent)' }}>{p.totalScore}</td>
                  <td style={{ padding: '10px 12px' }}>{p.matches}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ background: 'var(--accent-light)', color: 'var(--border)', border: '2px solid var(--border)', padding: '4px 10px', fontSize: 12, fontWeight: 900 }}>{p.avgScore}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
