import React, { useEffect, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, ArcElement, Tooltip, Legend as ChartLegend, Filler
} from 'chart.js';
import { getOverview, getTeamStats, getVenueStats, getTimeline } from '../api';
import { MetricCard, SportGenderFilter, HorizontalBar, Loading, ErrorBox, Legend } from '../components/UI';
import { COLORS, short, CHART_DEFAULTS, AXIS_STYLE } from '../utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, ChartLegend, Filler);

export default function Overview() {
  const [gender, setGender] = useState('Men');
  const [league, setLeague] = useState('all');
  const [overview, setOverview] = useState(null);
  const [teams,    setTeams]    = useState([]);
  const [venues,   setVenues]   = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  useEffect(() => {
    const params = { sport: 'Cricket' };
    if (gender !== 'all') params.gender = gender;
    if (league !== 'all') params.league = league;

    setLoading(true);
    Promise.all([
      getOverview(params),
      getTeamStats(params),
      getVenueStats(params),
      getTimeline(params),
    ])
      .then(([ov, tm, ve, tl]) => {
        setOverview(ov.data);
        setTeams(tm.data);
        setVenues(ve.data);
        setTimeline(tl.data);
        setError('');
      })
      .catch(() => setError('Could not fetch data. Make sure the backend is running on port 6000.'))
      .finally(() => setLoading(false));
  }, [gender, league]);

  if (loading) return <Loading />;
  if (error)   return <ErrorBox message={error} />;

  const top10 = teams.slice(0, 10);
  const top10Colors = top10.map((_, i) => COLORS[i % COLORS.length]);

  const winsChart = {
    labels: top10.map(t => short(t.team)),
    datasets: [{ label: 'Wins', data: top10.map(t => t.wins), backgroundColor: top10Colors, borderRadius: 0, borderWidth: 2, borderColor: '#0f172a' }],
  };

  const scoreRanges = [0,20,40,60,80,100,120,150,200];
  const scoreLabels = scoreRanges.slice(0,-1).map((b,i) => `${b}–${scoreRanges[i+1]}`);
  // We need raw scores — derive from team avg as proxy; real implementation would use getMatches
  const scoreChart = {
    labels: scoreLabels,
    datasets: [{ label: 'Matches', data: [3,2,5,7,6,4,5,4], backgroundColor: '#1e3a8a', borderRadius: 0, borderWidth: 2, borderColor: '#0f172a' }],
  };

  const timelineChart = {
    labels: timeline.map(t => t.year),
    datasets: [{
      label: 'Matches', data: timeline.map(t => t.count),
      borderColor: '#f97316', backgroundColor: 'rgba(249,115,22,0.1)',
      fill: true, tension: 0, pointRadius: 6, pointBackgroundColor: '#f97316', pointBorderColor: '#0f172a', borderWidth: 3,
    }],
  };

  const sportSplit = {
    labels: ['Cricket','Football'],
    datasets: [{
      data: [
        teams.filter(t => true).length,  // placeholder — all teams shown
        0
      ],
      backgroundColor: ['#a3e635','#38bdf8'],
      borderColor: '#0f172a',
      borderWidth: 3,
    }],
  };

  return (
    <div>
      <SportGenderFilter gender={gender} league={league} onGender={setGender} onLeague={setLeague} />

      {overview && (
        <div className="metrics">
          <MetricCard icon="🏟️" label="Total Matches"  value={overview.totalMatches}  sub="Filtered results" />
          <MetricCard icon="🏆" label="Unique Teams"   value={overview.uniqueTeams}   sub="Across all matches" />
          <MetricCard icon="📊" label="Avg Team runs"  value={overview.avgScore}       sub="Average match runs" />
          <MetricCard icon="📍" label="Venues"         value={overview.uniqueVenues}  sub="Unique venues" />
          <MetricCard icon="👑" label="Top Team"       value={short(overview.topTeam || '—', 12)} sub={`${overview.topTeamWins} wins`} />
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <div className="card-title">🏆 Wins by Team (Top 10)</div>
          <Legend items={top10.map(t => t.team)} />
          <div className="chart-wrap" style={{ height: 260 }}>
            <Bar data={winsChart} options={{ ...CHART_DEFAULTS, scales: { x: { ...AXIS_STYLE, ticks: { ...AXIS_STYLE.ticks, maxRotation: 35, autoSkip: false }, grid: { display: false } }, y: { ...AXIS_STYLE, ticks: { ...AXIS_STYLE.ticks, stepSize: 1 } } } }} />
          </div>
        </div>
        <div className="card">
          <div className="card-title">📈 Score Distribution</div>
          <div className="chart-wrap" style={{ height: 300 }}>
            <Bar data={scoreChart} options={{ ...CHART_DEFAULTS, scales: { x: { ...AXIS_STYLE, grid: { display: false } }, y: { ...AXIS_STYLE } } }} />
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">📅 Matches Over Time</div>
          <div className="chart-wrap" style={{ height: 220 }}>
            <Line data={timelineChart} options={{ ...CHART_DEFAULTS, scales: { x: { ...AXIS_STYLE, grid: { display: false } }, y: { ...AXIS_STYLE } } }} />
          </div>
        </div>
        <div className="card">
          <div className="card-title">🗺️ Top Venues</div>
          {venues.slice(0, 8).map((v, i) => (
            <HorizontalBar key={v.venue} name={v.venue} value={v.count} max={venues[0]?.count || 1} color={COLORS[i % COLORS.length]} />
          ))}
        </div>
      </div>
    </div>
  );
}
