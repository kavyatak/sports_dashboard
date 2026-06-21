/**
 * migrate.js — One-time migration from flat files to MongoDB
 *
 * Reads existing data/matches.csv, data/upcoming.csv, and data/users.json
 * and inserts all records into MongoDB Atlas.
 *
 * Run: node migrate.js
 */

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
require('./models/db');
const mongoose = require('mongoose');
const User = require('./models/User');
const Match = require('./models/Match');
const Upcoming = require('./models/Upcoming');

const DATA_DIR = path.join(__dirname, 'data');

function readCSV(file) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) return [];
  const csvData = fs.readFileSync(filePath, 'utf-8');
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
}

function readJSON(file) {
  const filePath = path.join(DATA_DIR, file);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

mongoose.connection.once('open', async () => {
  try {
    console.log('\n🚀 Starting migration to MongoDB...\n');

    // ── 1. Migrate Users ─────────────────────────────
    const users = readJSON('users.json');
    if (users.length > 0) {
      // Clear existing users (avoid duplicates on re-run)
      await User.deleteMany({});
      const userDocs = users.map(u => ({
        name: u.name,
        email: u.email,
        password: u.password,      // Already hashed with bcrypt
        createdAt: u.createdAt,
      }));
      await User.insertMany(userDocs);
      console.log(`✅ Users: Migrated ${userDocs.length} users`);
    } else {
      console.log('⚠️  Users: No users.json found or empty');
    }

    // ── 2. Migrate Matches ───────────────────────────
    const matches = readCSV('matches.csv');
    if (matches.length > 0) {
      await Match.deleteMany({});
      // Remove the old 'id' field (MongoDB uses _id)
      const matchDocs = matches.map(m => {
        const { id, ...rest } = m;
        return rest;
      });
      await Match.insertMany(matchDocs);
      console.log(`✅ Matches: Migrated ${matchDocs.length} matches`);
    } else {
      console.log('⚠️  Matches: No matches.csv found or empty');
    }

    // ── 3. Migrate Upcoming ──────────────────────────
    const upcoming = readCSV('upcoming.csv');
    if (upcoming.length > 0) {
      await Upcoming.deleteMany({});
      const upcomingDocs = upcoming.map(u => {
        const { id, ...rest } = u;
        return rest;
      });
      await Upcoming.insertMany(upcomingDocs);
      console.log(`✅ Upcoming: Migrated ${upcomingDocs.length} upcoming matches`);
    } else {
      console.log('⚠️  Upcoming: No upcoming.csv found or empty');
    }

    // ── 4. Verify ────────────────────────────────────
    const userCount = await User.countDocuments();
    const matchCount = await Match.countDocuments();
    const upcomingCount = await Upcoming.countDocuments();

    console.log('\n════════════════════════════════════════');
    console.log('  📊 Migration Summary');
    console.log('════════════════════════════════════════');
    console.log(`  Users     in MongoDB: ${userCount}`);
    console.log(`  Matches   in MongoDB: ${matchCount}`);
    console.log(`  Upcoming  in MongoDB: ${upcomingCount}`);
    console.log('════════════════════════════════════════');
    console.log('\n✅ Migration complete! You can now start the server with: node server.js\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Migration failed:', err);
    process.exit(1);
  }
});
