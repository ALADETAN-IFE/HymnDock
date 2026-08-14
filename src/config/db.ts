/**
 * db.ts
 *
 * Opens (or creates) hymn_dock.db once at startup and runs all schema
 * migrations. Export the single `db` instance for use throughout the app.
 */

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import logger from "@/utils/logger";

const DATA_DIR = path.resolve(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, "hymn_dock.db");

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Schema migrations ────────────────────────────────────────────────────────

db.exec(`
  -- Permanent hymn content cache. Scraped once, kept forever.
  -- Use the Refresh button on the dock to force a re-scrape.
  CREATE TABLE IF NOT EXISTS hymn_cache (
    url        TEXT PRIMARY KEY,
    number     INTEGER,
    data       TEXT NOT NULL,
    cached_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );

  -- Cache: hymn number → canonical hymn page URL
  CREATE TABLE IF NOT EXISTS hymn_url_cache (
    number     INTEGER PRIMARY KEY,
    url        TEXT NOT NULL,
    cached_at  INTEGER NOT NULL DEFAULT (unixepoch())
  );

  -- Per-session OBS display state (one row per operator session)
  CREATE TABLE IF NOT EXISTS sessions (
    id         TEXT PRIMARY KEY,
    state      TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

logger.info("DB", `SQLite database ready at ${DB_PATH}`);

export default db;
