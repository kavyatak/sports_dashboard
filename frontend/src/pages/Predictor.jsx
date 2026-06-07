import React, { useEffect, useState } from 'react';
import { getTeamStats, getPredict, getUpcoming } from '../api';
import { SportGenderFilter, Loading, ErrorBox } from '../components/UI';
import { short } from '../utils';

export default function Predictor() {
  const [gender, setGender] = useState('Men');
  const [league, setLeague] = useState('all');
  const [teams,  setTeams]  = useState([]);
  const [teamA,  setTeamA]  = useState('');
  const [teamB,  setTeamB]  = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Upcoming predictor
  const [upcoming,    setUpcoming]    = useState([]);
  const [selectedFix, setSelectedFix] = useState('');
  const [upResult,    setUpResult]    = useState(null);
  const [upLoading,   setUpLoading]   = useState(false);

  useEffect(() => {
    const params = { sport: 'Cricket', gender };
    if (league !== 'all') params.league = league;
    getTeamStats(params)
      .then(r => {
        setTeams(r.data);
        setTeamA('');
        setTeamB('');
        setResult(null);
      })
      .catch(() => {});
      
    const upcomingParams = { sport: 'Cricket', gender };
    if (league !== 'all') upcomingParams.league = league;
    getUpcoming(upcomingParams)
      .then(r => { setUpcoming(r.data); setSelectedFix(''); setUpResult(null); })
      .catch(() => {});
  }, [gender, league]);

  function predict() {
    if (!teamA || !teamB || teamA === teamB) return;
    setLoading(true);
    const params = { teamA, teamB, sport: 'Cricket', gender };
    if (league !== 'all') params.league = league;
    getPredict(params)
      .then(r => { setResult(r.data); setError(''); })
      .catch(() => setError('Prediction failed.'))
      .finally(() => setLoading(false));
  }

  function predictUpcoming() {
    if (!selectedFix) return;
    const fix = upcoming.find(u => String(u.id) === selectedFix);
    if (!fix) return;
    setUpLoading(true);
    getPredict({ teamA: fix.teamA, teamB: fix.teamB, sport: 'Cricket', gender: fix.gender })
      .then(r => setUpResult({ ...r.data, fixture: fix }))
      .catch(() => {})
      .finally(() => setUpLoading(false));
  }

  const teamNames = teams.map(t => t.team);

  return (
    <div>
      <SportGenderFilter gender={gender} league={league} onGender={g => { setGender(g); setResult(null); }} onLeague={setLeague} />

      <div className="grid-2">
        {/* Manual predictor */}
        <div className="card">
          <div className="card-title">🔮 Predict Any Match</div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: '1rem' }}>Based on head-to-head history and win rate model.</p>

          {error && <ErrorBox message={error} />}

          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>TEAM A</label>
          <select className="filter-select" style={{ width: '100%', marginBottom: 12 }}
            value={teamA} onChange={e => { setTeamA(e.target.value); setResult(null); }}>
            <option value="">Select Team A…</option>
            {teamNames.map(t => <option key={t}>{t}</option>)}
          </select>

          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>TEAM B</label>
          <select className="filter-select" style={{ width: '100%', marginBottom: 16 }}
            value={teamB} onChange={e => { setTeamB(e.target.value); setResult(null); }}>
            <option value="">Select Team B…</option>
            {teamNames.filter(t => t !== teamA).map(t => <option key={t}>{t}</option>)}
          </select>

          <button className="btn btn-gradient" style={{ width: '100%', padding: 10, fontSize: 14 }} onClick={predict} disabled={!teamA || !teamB}>
            🔮 Predict Winner
          </button>

          {loading && <Loading />}

          {result && !loading && (
            <div className="predict-result">
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Predicted Winner</div>
              <div className="predict-winner">{result.winner}</div>
              <div className="predict-confidence">Confidence: {result.confidence}%</div>
              <div className="predict-sub">Method: {result.method}</div>
              <div className="predict-sub">Based on {result.totalMatches} historical match{result.totalMatches !== 1 ? 'es' : ''}</div>
            </div>
          )}
        </div>

        {/* Upcoming fixture predictor */}
        <div className="card">
          <div className="card-title">📅 Predict Upcoming Fixture</div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: '1rem' }}>Select any scheduled fixture for an instant prediction.</p>

          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>SELECT FIXTURE</label>
          <select className="filter-select" style={{ width: '100%', marginBottom: 16 }}
            value={selectedFix} onChange={e => { setSelectedFix(e.target.value); setUpResult(null); }}>
            <option value="">Choose a fixture…</option>
            {upcoming.sort((a,b) => a.date.localeCompare(b.date)).map(u => (
              <option key={u.id} value={String(u.id)}>
                {u.teamA} vs {u.teamB} — {new Date(u.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})} ({u.sport})
              </option>
            ))}
          </select>

          <button className="btn btn-green" style={{ width: '100%', padding: 10, fontSize: 14 }} onClick={predictUpcoming} disabled={!selectedFix}>
            ⚡ Get Prediction
          </button>

          {upLoading && <Loading />}

          {upResult && !upLoading && (
            <div className="predict-result" style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                {upResult.fixture.teamA} vs {upResult.fixture.teamB}
                <br />
                📍 {upResult.fixture.venue.split(',')[0]} · {new Date(upResult.fixture.date).toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})}
              </div>
              <div className="predict-winner">{upResult.winner}</div>
              <div className="predict-confidence">Confidence: {upResult.confidence}%</div>
              <div className="predict-sub">Method: {upResult.method}</div>
            </div>
          )}
        </div>
      </div>

      {/* Confidence explainer */}
      <div className="card">
        <div className="card-title">ℹ️ How Predictions Work</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))', gap: 16, fontSize: 13, color: 'var(--muted)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Head-to-Head</div>
            When teams have 2+ past matches, the model uses their direct win/loss record to calculate likelihood.
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Stats Model</div>
            When no H2H data exists, we use overall win rate (60% weight) + average score performance (40% weight).
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Confidence %</div>
            Reflects how dominant one team is in the data. 50% = evenly matched. 90%+ = strong historical advantage.
          </div>
        </div>
      </div>
    </div>
  );
}
