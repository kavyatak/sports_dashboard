const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { syncData } = require('./sync');
const { router: authRouter } = require('./auth');
const { fetchCurrentMatches, fetchCricScore, getCredits, isConfigured } = require('./cricapi');
const { SYNC_INTERVAL_MS } = require('./config');

const app = express();
const PORT = 6000;

app.use(cors());
app.use(express.json());

// ── Auth routes ──────────────────────────────────────
app.use('/api/auth', authRouter);

// ── Sync interval (from config — default 3 min) ────────────────

// Trigger sync on startup, then periodically
syncData()
  .then((res) => console.log('💡 [SYNC] Initial startup sync completed:', res))
  .catch((err) => console.error('❌ [SYNC] Initial startup sync failed:', err));

setInterval(() => {
  syncData()
    .then((res) => console.log('💡 [SYNC] Periodic sync completed:', res))
    .catch((err) => console.error('❌ [SYNC] Periodic sync failed:', err));
}, SYNC_INTERVAL_MS);

// ── helpers ──────────────────────────────────────────────
const dataPath = (file) => path.join(__dirname, 'data', file);
const readCSV = (file) => {
  const csvData = fs.readFileSync(dataPath(file), 'utf-8');
  const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true });
  return parsed.data.map(row => {
    for (const key in row) {
      if (row[key] === '') row[key] = null;
      else if (!isNaN(row[key]) && row[key] !== null && String(row[key]).trim() !== '') {
        row[key] = Number(row[key]);
      }
    }
    return row;
  });
};
const writeCSV = (file, data) => fs.writeFileSync(dataPath(file), Papa.unparse(data));

// ════════════════════════════════════════════════════════
//  MATCHES
// ════════════════════════════════════════════════════════

// GET /api/matches  — with optional ?sport=&gender=&venue=&team=&league=
app.get('/api/matches', (req, res) => {
  let matches = readCSV('matches.csv');
  const { sport, gender, venue, team, player, league } = req.query;

  if (sport)   matches = matches.filter(m => m.sport   === sport);
  if (gender)  matches = matches.filter(m => m.gender  === gender);
  if (venue)   matches = matches.filter(m => m.venue   === venue);
  if (league)  matches = matches.filter(m => m.league  === league);
  if (team)    matches = matches.filter(m => m.winner  === team || m.loser === team);
  if (player)  matches = matches.filter(m => m.player.toLowerCase().includes(player.toLowerCase()));

  res.json(matches);
});

// GET /api/matches/:id
app.get('/api/matches/:id', (req, res) => {
  const matches = readCSV('matches.csv');
  const match = matches.find(m => m.id === parseInt(req.params.id));
  if (!match) return res.status(404).json({ error: 'Match not found' });
  res.json(match);
});

// POST /api/matches  — add a new match
app.post('/api/matches', (req, res) => {
  const matches = readCSV('matches.csv');
  const newMatch = {
    id: matches.length ? Math.max(...matches.map(m => m.id)) + 1 : 1,
    ...req.body,
  };
  matches.push(newMatch);
  writeCSV('matches.csv', matches);
  res.status(201).json(newMatch);
});

// PUT /api/matches/:id  — update a match
app.put('/api/matches/:id', (req, res) => {
  const matches = readCSV('matches.csv');
  const idx = matches.findIndex(m => m.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Match not found' });
  matches[idx] = { ...matches[idx], ...req.body };
  writeCSV('matches.csv', matches);
  res.json(matches[idx]);
});

// DELETE /api/matches/:id
app.delete('/api/matches/:id', (req, res) => {
  let matches = readCSV('matches.csv');
  const exists = matches.find(m => m.id === parseInt(req.params.id));
  if (!exists) return res.status(404).json({ error: 'Match not found' });
  matches = matches.filter(m => m.id !== parseInt(req.params.id));
  writeCSV('matches.csv', matches);
  res.json({ message: 'Deleted successfully' });
});

// ════════════════════════════════════════════════════════
//  STATS / ANALYTICS
// ════════════════════════════════════════════════════════

// GET /api/stats/overview?sport=&gender=&league=
app.get('/api/stats/overview', (req, res) => {
  let matches = readCSV('matches.csv');
  const { sport, gender, league } = req.query;
  if (sport)  matches = matches.filter(m => m.sport  === sport);
  if (gender) matches = matches.filter(m => m.gender === gender);
  if (league) matches = matches.filter(m => m.league === league);

  const totalMatches  = matches.length;
  const uniqueTeams   = new Set([...matches.map(m => m.winner), ...matches.map(m => m.loser)]).size;
  const uniqueVenues  = new Set(matches.map(m => m.venue)).size;
  const avgScore      = totalMatches ? +(matches.reduce((s, m) => s + m.score, 0) / totalMatches).toFixed(1) : 0;
  const topTeamEntry  = Object.entries(
    matches.reduce((acc, m) => { acc[m.winner] = (acc[m.winner] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1])[0];

  res.json({ totalMatches, uniqueTeams, uniqueVenues, avgScore, topTeam: topTeamEntry ? topTeamEntry[0] : null, topTeamWins: topTeamEntry ? topTeamEntry[1] : 0 });
});

// GET /api/stats/teams?sport=&gender=&league=
app.get('/api/stats/teams', (req, res) => {
  let matches = readCSV('matches.csv');
  const { sport, gender, league } = req.query;
  if (sport)  matches = matches.filter(m => m.sport  === sport);
  if (gender) matches = matches.filter(m => m.gender === gender);
  if (league) matches = matches.filter(m => m.league === league);

  const teamMap = {};
  matches.forEach(m => {
    if (!teamMap[m.winner]) teamMap[m.winner] = { team: m.winner, wins: 0, losses: 0, totalScore: 0, matches: 0 };
    if (!teamMap[m.loser])  teamMap[m.loser]  = { team: m.loser,  wins: 0, losses: 0, totalScore: 0, matches: 0 };
    teamMap[m.winner].wins++;
    teamMap[m.winner].totalScore += m.score;
    teamMap[m.winner].matches++;
    teamMap[m.loser].losses++;
    teamMap[m.loser].matches++;
  });

  const teams = Object.values(teamMap)
    .map(t => ({ ...t, winRate: t.matches ? +(t.wins / t.matches * 100).toFixed(1) : 0, avgScore: t.matches ? +(t.totalScore / t.matches).toFixed(1) : 0 }))
    .sort((a, b) => b.wins - a.wins);

  res.json(teams);
});

// GET /api/stats/players?sport=&gender=&league=
app.get('/api/stats/players', (req, res) => {
  let matches = readCSV('matches.csv');
  const { sport, gender, league } = req.query;
  if (sport)  matches = matches.filter(m => m.sport  === sport);
  if (gender) matches = matches.filter(m => m.gender === gender);
  if (league) matches = matches.filter(m => m.league === league);

  const pm = {};
  matches.forEach(m => {
    if (!pm[m.player]) pm[m.player] = { player: m.player, team: m.winner, totalScore: 0, matches: 0 };
    const pScore = (m.player_score !== undefined && m.player_score !== null) ? m.player_score : m.score;
    pm[m.player].totalScore += pScore;
    pm[m.player].matches++;
  });

  const players = Object.values(pm)
    .map(p => ({ ...p, avgScore: +(p.totalScore / p.matches).toFixed(1) }))
    .sort((a, b) => b.totalScore - a.totalScore);

  res.json(players);
});

// GET /api/stats/venues?sport=&gender=&league=
app.get('/api/stats/venues', (req, res) => {
  let matches = readCSV('matches.csv');
  const { sport, gender, league } = req.query;
  if (sport)  matches = matches.filter(m => m.sport  === sport);
  if (gender) matches = matches.filter(m => m.gender === gender);
  if (league) matches = matches.filter(m => m.league === league);

  const vm = {};
  matches.forEach(m => { vm[m.venue] = (vm[m.venue] || 0) + 1; });
  const venues = Object.entries(vm).map(([venue, count]) => ({ venue, count })).sort((a, b) => b.count - a.count);
  res.json(venues);
});

// GET /api/stats/h2h?teamA=&teamB=&sport=&gender=&league=
app.get('/api/stats/h2h', (req, res) => {
  const { teamA, teamB, sport, gender, league } = req.query;
  if (!teamA || !teamB) return res.status(400).json({ error: 'teamA and teamB required' });

  let matches = readCSV('matches.csv');
  if (sport)  matches = matches.filter(m => m.sport  === sport);
  if (gender) matches = matches.filter(m => m.gender === gender);
  if (league) matches = matches.filter(m => m.league === league);

  const h2h = matches.filter(m =>
    (m.winner === teamA && m.loser === teamB) ||
    (m.winner === teamB && m.loser === teamA)
  );

  const winsA = h2h.filter(m => m.winner === teamA).length;
  const winsB = h2h.filter(m => m.winner === teamB).length;
  const total = h2h.length;

  res.json({ teamA, teamB, winsA, winsB, total, matches: h2h, pctA: total ? +(winsA/total*100).toFixed(1) : 0, pctB: total ? +(winsB/total*100).toFixed(1) : 0 });
});

// GET /api/stats/timeline?sport=&gender=&league=
app.get('/api/stats/timeline', (req, res) => {
  let matches = readCSV('matches.csv');
  const { sport, gender, league } = req.query;
  if (sport)  matches = matches.filter(m => m.sport  === sport);
  if (gender) matches = matches.filter(m => m.gender === gender);
  if (league) matches = matches.filter(m => m.league === league);

  const byYear = {};
  matches.forEach(m => {
    const yr = m.date.substring(0, 4);
    byYear[yr] = (byYear[yr] || 0) + 1;
  });

  const timeline = Object.entries(byYear).sort((a,b) => a[0].localeCompare(b[0])).map(([year, count]) => ({ year, count }));
  res.json(timeline);
});

// GET /api/stats/predict?teamA=&teamB=&sport=&gender=&league=
app.get('/api/stats/predict', (req, res) => {
  const { teamA, teamB, sport, gender, league } = req.query;
  if (!teamA || !teamB) return res.status(400).json({ error: 'teamA and teamB required' });

  let matches = readCSV('matches.csv');
  if (sport)  matches = matches.filter(m => m.sport  === sport);
  if (gender) matches = matches.filter(m => m.gender === gender);
  if (league) matches = matches.filter(m => m.league === league);

  const h2h = matches.filter(m =>
    (m.winner === teamA && m.loser === teamB) ||
    (m.winner === teamB && m.loser === teamA)
  );

  if (h2h.length >= 2) {
    const wA = h2h.filter(m => m.winner === teamA).length;
    const pct = +(wA / h2h.length * 100).toFixed(1);
    return res.json({ winner: pct >= 50 ? teamA : teamB, confidence: Math.max(pct, 100 - pct), method: 'Head-to-head record', totalMatches: h2h.length });
  }

  const dA = matches.filter(m => m.winner === teamA || m.loser === teamA);
  const dB = matches.filter(m => m.winner === teamB || m.loser === teamB);
  const wRateA = dA.length ? dA.filter(m => m.winner === teamA).length / dA.length : 0.5;
  const wRateB = dB.length ? dB.filter(m => m.winner === teamB).length / dB.length : 0.5;
  const avgA = dA.length ? dA.reduce((s,m) => s+m.score,0)/dA.length : 0;
  const avgB = dB.length ? dB.reduce((s,m) => s+m.score,0)/dB.length : 0;
  const norm = avgA + avgB || 1;
  const sA = wRateA * 0.6 + (avgA/norm) * 0.4;
  const sB = wRateB * 0.6 + (avgB/norm) * 0.4;
  const tot = sA + sB || 1;
  const conf = +(Math.max(sA, sB) / tot * 100).toFixed(1);

  res.json({ winner: sA >= sB ? teamA : teamB, confidence: conf, method: 'Overall stats model', totalMatches: dA.length + dB.length });
});

// ════════════════════════════════════════════════════════
//  UPCOMING MATCHES
// ════════════════════════════════════════════════════════

// GET /api/upcoming?sport=&gender=&league=
app.get('/api/upcoming', (req, res) => {
  let upcoming = readCSV('upcoming.csv');
  const { sport, gender, league } = req.query;
  if (sport)  upcoming = upcoming.filter(m => m.sport  === sport);
  if (gender) upcoming = upcoming.filter(m => m.gender === gender);
  if (league) upcoming = upcoming.filter(m => m.league === league);
  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  res.json(upcoming);
});

// GET /api/upcoming/:id
app.get('/api/upcoming/:id', (req, res) => {
  const upcoming = readCSV('upcoming.csv');
  const match = upcoming.find(m => m.id === parseInt(req.params.id));
  if (!match) return res.status(404).json({ error: 'Not found' });
  res.json(match);
});

// POST /api/upcoming
app.post('/api/upcoming', (req, res) => {
  const upcoming = readCSV('upcoming.csv');
  const newMatch = { id: upcoming.length ? Math.max(...upcoming.map(m => m.id)) + 1 : 1, ...req.body };
  upcoming.push(newMatch);
  writeCSV('upcoming.csv', upcoming);
  res.status(201).json(newMatch);
});

// DELETE /api/upcoming/:id
app.delete('/api/upcoming/:id', (req, res) => {
  let upcoming = readCSV('upcoming.csv');
  const exists = upcoming.find(m => m.id === parseInt(req.params.id));
  if (!exists) return res.status(404).json({ error: 'Not found' });
  upcoming = upcoming.filter(m => m.id !== parseInt(req.params.id));
  writeCSV('upcoming.csv', upcoming);
  res.json({ message: 'Deleted' });
});

// ── filter options ─────────────────────────────────────
app.get('/api/options', (req, res) => {
  const matches = readCSV('matches.csv');
  res.json({
    sports:  [...new Set(matches.map(m => m.sport))].sort(),
    genders: [...new Set(matches.map(m => m.gender))].sort(),
    venues:  [...new Set(matches.map(m => m.venue))].sort(),
    teams:   [...new Set([...matches.map(m => m.winner), ...matches.map(m => m.loser)])].sort(),
    leagues: [...new Set(matches.map(m => m.league || 'Other'))].filter(Boolean).sort(),
  });
});

// ── manual sync ────────────────────────────────────────
app.post('/api/sync', async (req, res) => {
  try {
    const result = await syncData();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ════════════════════════════════════════════════════════
//  LIVE DATA (from CricAPI)
// ════════════════════════════════════════════════════════

// GET /api/live — returns live/recent matches from CricAPI cache
app.get('/api/live', async (_req, res) => {
  try {
    const matches = await fetchCurrentMatches();
    res.json(matches || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch live data', message: err.message });
  }
});

// GET /api/credits — returns API usage info
app.get('/api/credits', (_req, res) => {
  res.json(getCredits());
});

// ── health check ───────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  time: new Date().toISOString(),
  apiConfigured: isConfigured(),
}));

app.listen(PORT, () => {
  console.log(`\n🏆 Sports Dashboard API running at http://localhost:${PORT}`);
  console.log(`   🟢 CricAPI: ${isConfigured() ? 'Configured' : 'NOT configured — using demo data'}`);
  console.log(`   🔄 Sync interval: ${SYNC_INTERVAL_MS / 1000}s`);
  console.log(``);
  console.log(`   POST /api/auth/register`);
  console.log(`   POST /api/auth/login`);
  console.log(`   GET  /api/auth/me`);
  console.log(`   GET  /api/live          ← Real-time matches`);
  console.log(`   GET  /api/credits       ← API usage`);
  console.log(`   GET  /api/matches`);
  console.log(`   GET  /api/stats/overview`);
  console.log(`   GET  /api/stats/teams`);
  console.log(`   GET  /api/stats/players`);
  console.log(`   GET  /api/stats/venues`);
  console.log(`   GET  /api/stats/h2h`);
  console.log(`   GET  /api/stats/predict`);
  console.log(`   GET  /api/upcoming\n`);
});
