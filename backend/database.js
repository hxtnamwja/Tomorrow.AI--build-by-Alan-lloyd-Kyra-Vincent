import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DB_PATH
  ? resolve(process.env.DB_PATH)
  : join(__dirname, 'data', 'sci_demo_hub.db');

// Ensure data directory exists
const dataDir = dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Preserve installations that used one of the historical database locations.
// Only migrate when the configured persistent database does not exist yet.
if (!fs.existsSync(DB_PATH)) {
  const legacyPaths = [
    join(__dirname, 'database.sqlite'),
    join(__dirname, 'database.db'),
    join(__dirname, 'scripts', 'data', 'sci_demo_hub.db'),
    join(__dirname, 'scripts', 'database.db')
  ];
  const legacyDb = legacyPaths.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).size > 0);
  if (legacyDb) {
    fs.copyFileSync(legacyDb, DB_PATH);
    console.log(`[Database] Migrated legacy database from ${legacyDb} to ${DB_PATH}`);
  }
}

let db = null;

export const initDatabase = () => {
  if (db) return db;
  
  console.log('[Database] Using database:', DB_PATH);
  db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log('Connected to SQLite database');
    }
  });
  
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = WAL');
  
  return db;
};

export const getDatabase = () => {
  if (!db) {
    return initDatabase();
  }
  return db;
};

export const closeDatabase = () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err);
      }
    });
    db = null;
  }
};

// Helper to run queries with promises
export const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Helper to get single row
export const getRow = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Helper to get all rows
export const getAllRows = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

export const ensureSiteSubAdminRole = async () => {
  const schema = await getRow("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'");
  if (!schema?.sql || schema.sql.includes("'site_sub_admin'")) return;

  console.log('[Database] Migrating users.role constraint for site sub-admin support');
  await runQuery('PRAGMA foreign_keys = OFF');
  await runQuery('PRAGMA legacy_alter_table = ON');
  await runQuery('BEGIN TRANSACTION');
  try {
    await runQuery('ALTER TABLE users RENAME TO users_legacy_role');
    await runQuery(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'general_admin', 'site_sub_admin')),
        created_at INTEGER NOT NULL,
        is_banned INTEGER DEFAULT 0,
        ban_reason TEXT,
        contact_info TEXT,
        payment_qr TEXT,
        bio TEXT,
        password TEXT,
        contribution_points INTEGER DEFAULT 0,
        points INTEGER DEFAULT 0,
        favorites TEXT DEFAULT '[]',
        avatar_border TEXT,
        username_color TEXT,
        profile_theme TEXT,
        avatar_accessory TEXT,
        avatar_effect TEXT,
        username_effect TEXT,
        profile_background TEXT,
        custom_title TEXT,
        unlocked_achievements TEXT DEFAULT '[]',
        owned_items TEXT DEFAULT '[]',
        community_points INTEGER DEFAULT 0
      )
    `);
    await runQuery(`
      INSERT INTO users (
        id, username, role, created_at, is_banned, ban_reason, contact_info, payment_qr,
        bio, password, contribution_points, points, favorites, avatar_border, username_color,
        profile_theme, avatar_accessory, avatar_effect, username_effect, profile_background,
        custom_title, unlocked_achievements, owned_items, community_points
      )
      SELECT
        id, username, role, created_at, is_banned, ban_reason, contact_info, payment_qr,
        bio, password, contribution_points, points, favorites, avatar_border, username_color,
        profile_theme, avatar_accessory, avatar_effect, username_effect, profile_background,
        custom_title, unlocked_achievements, owned_items, community_points
      FROM users_legacy_role
    `);
    await runQuery('DROP TABLE users_legacy_role');
    await runQuery('COMMIT');
  } catch (error) {
    await runQuery('ROLLBACK');
    throw error;
  } finally {
    await runQuery('PRAGMA legacy_alter_table = OFF');
    await runQuery('PRAGMA foreign_keys = ON');
  }
};
