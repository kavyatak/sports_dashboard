/**
 * cricapi.js — CricAPI wrapper with in-memory caching
 *
 * Fetches real-time cricket data from api.cricapi.com/v1
 * Caches responses in memory to avoid burning through the daily 100-hit limit.
 */

const https = require('https');
const { CRICAPI_KEY, CRICAPI_BASE, CACHE_TTL_MS } = require('./config');

// ── In-memory cache ──────────────────────────────────
const cache = {
  currentMatches: { data: null, fetchedAt: 0 },
  cricScore:      { data: null, fetchedAt: 0 },
  credits:        { hitsToday: 0, hitsLimit: 100 },
};

// ── HTTP helper ──────────────────────────────────────
function fetchJSON(endpoint, params = {}) {
  return new Promise((resolve, reject) => {
    const qs = new URLSearchParams({ apikey: CRICAPI_KEY, ...params }).toString();
    const url = `${CRICAPI_BASE}/${endpoint}?${qs}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.info) {
            cache.credits.hitsToday = parsed.info.hitsToday || 0;
            cache.credits.hitsLimit = parsed.info.hitsLimit || 100;
          }
          resolve(parsed);
        } catch (err) {
          reject(new Error(`Failed to parse CricAPI response: ${err.message}`));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ── Check if API key is configured ───────────────────
function isConfigured() {
  return CRICAPI_KEY && CRICAPI_KEY !== 'YOUR_API_KEY_HERE' && CRICAPI_KEY.length > 10;
}

// ── Fetch current/live matches (with cache) ──────────
async function fetchCurrentMatches(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cache.currentMatches.data && (now - cache.currentMatches.fetchedAt) < CACHE_TTL_MS) {
    return cache.currentMatches.data;
  }

  if (!isConfigured()) {
    console.log('  ⚠️  CricAPI key not configured — returning demo data');
    return getDemoData();
  }

  try {
    console.log('  🌐 Fetching live matches from CricAPI...');
    const res = await fetchJSON('currentMatches');

    if (res.status === 'success' && Array.isArray(res.data)) {
      cache.currentMatches.data = res.data;
      cache.currentMatches.fetchedAt = now;
      console.log(`  ✅ Got ${res.data.length} matches (${cache.credits.hitsToday}/${cache.credits.hitsLimit} hits used)`);
      return res.data;
    } else {
      console.error('  ❌ CricAPI returned error:', res.status, res.reason || '');
      return cache.currentMatches.data || getDemoData();
    }
  } catch (err) {
    console.error('  ❌ CricAPI fetch failed:', err.message);
    return cache.currentMatches.data || getDemoData();
  }
}

// ── Fetch quick score ticker (with cache) ────────────
async function fetchCricScore(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cache.cricScore.data && (now - cache.cricScore.fetchedAt) < CACHE_TTL_MS) {
    return cache.cricScore.data;
  }

  if (!isConfigured()) {
    return [];
  }

  try {
    const res = await fetchJSON('cricScore');
    if (res.status === 'success' && Array.isArray(res.data)) {
      cache.cricScore.data = res.data;
      cache.cricScore.fetchedAt = now;
      return res.data;
    }
    return cache.cricScore.data || [];
  } catch (err) {
    console.error('  ❌ CricScore fetch failed:', err.message);
    return cache.cricScore.data || [];
  }
}

// ── Get API credits info ─────────────────────────────
function getCredits() {
  return {
    ...cache.credits,
    configured: isConfigured(),
    cacheAge: cache.currentMatches.fetchedAt
      ? Math.round((Date.now() - cache.currentMatches.fetchedAt) / 1000)
      : null,
  };
}

// ── Get cached data without fetching ─────────────────
function getCachedMatches() {
  return cache.currentMatches.data || [];
}

// ── Demo data for when API key is not set ────────────
function getDemoData() {
  return [
    {
      id: 'demo-1',
      name: 'India vs Australia, 3rd T20I',
      matchType: 't20',
      status: 'India won by 6 wickets',
      venue: 'M. Chinnaswamy Stadium, Bengaluru',
      date: new Date().toISOString().split('T')[0],
      dateTimeGMT: new Date().toISOString(),
      teams: ['India', 'Australia'],
      score: [
        { r: 186, w: 4, o: 20, inning: 'India Inning 1' },
        { r: 172, w: 8, o: 20, inning: 'Australia Inning 1' },
      ],
    },
    {
      id: 'demo-2',
      name: 'Chennai Super Kings vs Mumbai Indians, IPL 2026',
      matchType: 't20',
      status: 'Chennai Super Kings won by 25 runs',
      venue: 'M. A. Chidambaram Stadium, Chennai',
      date: new Date().toISOString().split('T')[0],
      dateTimeGMT: new Date().toISOString(),
      teams: ['Chennai Super Kings', 'Mumbai Indians'],
      score: [
        { r: 198, w: 5, o: 20, inning: 'Chennai Super Kings Inning 1' },
        { r: 173, w: 9, o: 20, inning: 'Mumbai Indians Inning 1' },
      ],
    },
    {
      id: 'demo-3',
      name: 'England vs South Africa, 2nd ODI',
      matchType: 'odi',
      status: 'Match started',
      venue: "Lord's, London",
      date: new Date().toISOString().split('T')[0],
      dateTimeGMT: new Date().toISOString(),
      teams: ['England', 'South Africa'],
      score: [
        { r: 142, w: 3, o: 28.4, inning: 'England Inning 1' },
      ],
    },
    {
      id: 'demo-4',
      name: 'Royal Challengers Bangalore vs Kolkata Knight Riders, IPL 2026',
      matchType: 't20',
      status: 'Match not started',
      venue: 'M. Chinnaswamy Stadium, Bengaluru',
      date: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })(),
      dateTimeGMT: (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString(); })(),
      teams: ['Royal Challengers Bangalore', 'Kolkata Knight Riders'],
      score: [],
    },
  ];
}

module.exports = {
  fetchCurrentMatches,
  fetchCricScore,
  getCredits,
  getCachedMatches,
  isConfigured,
};
