/**
 * config.js — Central configuration for the Sports Dashboard
 *
 * ╔══════════════════════════════════════════════════════╗
 * ║  PASTE YOUR CRICAPI KEY BELOW                       ║
 * ║  Get a free key at: https://cricketdata.org         ║
 * ╚══════════════════════════════════════════════════════╝
 */

module.exports = {
  // ── CricAPI Settings ──────────────────────────────────
  CRICAPI_KEY: '0f7a9234-c8f3-4e58-822a-6a7fe45bdfa0',   // Your CricAPI key
  CRICAPI_BASE: 'https://api.cricapi.com/v1',

  // ── Sync Settings ─────────────────────────────────────
  SYNC_INTERVAL_MS: 3 * 60 * 1000,   // Fetch from CricAPI every 3 minutes
  CACHE_TTL_MS: 60 * 1000,           // Serve cached data for 60 seconds

  // ── Historical Data ───────────────────────────────────
  IPL_CSV_URL: 'https://raw.githubusercontent.com/avinashyadav16/ipl-analytics/main/matches_2008-2024.csv',
};
