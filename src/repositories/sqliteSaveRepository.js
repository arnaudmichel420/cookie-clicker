const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const UPGRADE_LEVEL_COLUMNS = Object.freeze({
  pickup: "pickup_level",
  oil: "oil_level",
  wallStreet: "wall_street_level",
  gold: "gold_level",
  diamond: "diamond_level"
});

function mapSave(row) {
  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    cookies: row.trump_dollars,
    cookiesPerSecond: row.trump_dollars_per_second,
    cookiesPerClick: row.trump_dollars_per_click,
    lastCollectedAt: row.last_collected_at,
    upgradeLevels: {
      pickup: row.pickup_level,
      oil: row.oil_level,
      wallStreet: row.wall_street_level,
      gold: row.gold_level,
      diamond: row.diamond_level
    }
  };
}

function ensureColumn(db, columnName, definition) {
  const columns = db.prepare("PRAGMA table_info(game_saves)").all();
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    db.exec(`ALTER TABLE game_saves ADD COLUMN ${columnName} ${definition}`);
  }
}

function backfillNullColumn(db, columnName, fallbackExpression) {
  db.exec(`
    UPDATE game_saves
    SET ${columnName} = ${fallbackExpression}
    WHERE ${columnName} IS NULL
  `);
}

function createSqliteSaveRepository(dbPath) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS game_saves (
      user_id INTEGER PRIMARY KEY,
      trump_dollars INTEGER NOT NULL DEFAULT 0,
      trump_dollars_per_second INTEGER NOT NULL DEFAULT 0,
      trump_dollars_per_click INTEGER NOT NULL DEFAULT 1,
      pickup_level INTEGER NOT NULL DEFAULT 0,
      oil_level INTEGER NOT NULL DEFAULT 0,
      wall_street_level INTEGER NOT NULL DEFAULT 0,
      gold_level INTEGER NOT NULL DEFAULT 0,
      diamond_level INTEGER NOT NULL DEFAULT 0,
      last_collected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  ensureColumn(db, "trump_dollars_per_click", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn(db, "pickup_level", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "oil_level", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "wall_street_level", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "gold_level", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "diamond_level", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "last_collected_at", "TEXT");
  backfillNullColumn(db, "last_collected_at", "CURRENT_TIMESTAMP");

  const statements = {
    findByUserId: db.prepare(`
      SELECT
        user_id,
        trump_dollars,
        trump_dollars_per_second,
        trump_dollars_per_click,
        pickup_level,
        oil_level,
        wall_street_level,
        gold_level,
        diamond_level,
        last_collected_at
      FROM game_saves
      WHERE user_id = ?
    `),
    save: db.prepare(`
      INSERT INTO game_saves (
        user_id,
        trump_dollars,
        trump_dollars_per_second,
        trump_dollars_per_click,
        pickup_level,
        oil_level,
        wall_street_level,
        gold_level,
        diamond_level,
        last_collected_at,
        updated_at
      )
      VALUES (
        @userId,
        @cookies,
        @cookiesPerSecond,
        @cookiesPerClick,
        @pickupLevel,
        @oilLevel,
        @wallStreetLevel,
        @goldLevel,
        @diamondLevel,
        @lastCollectedAt,
        CURRENT_TIMESTAMP
      )
      ON CONFLICT(user_id) DO UPDATE SET
        trump_dollars = excluded.trump_dollars,
        trump_dollars_per_second = excluded.trump_dollars_per_second,
        trump_dollars_per_click = excluded.trump_dollars_per_click,
        pickup_level = excluded.pickup_level,
        oil_level = excluded.oil_level,
        wall_street_level = excluded.wall_street_level,
        gold_level = excluded.gold_level,
        diamond_level = excluded.diamond_level,
        last_collected_at = excluded.last_collected_at,
        updated_at = CURRENT_TIMESTAMP
    `)
  };

  return {
    async findByUserId(userId) {
      return mapSave(statements.findByUserId.get(userId));
    },
    async save(userId, stats) {
      statements.save.run({
        userId,
        cookies: stats.cookies,
        cookiesPerSecond: stats.cookiesPerSecond,
        cookiesPerClick: stats.cookiesPerClick,
        lastCollectedAt: stats.lastCollectedAt,
        pickupLevel: stats.upgradeLevels.pickup,
        oilLevel: stats.upgradeLevels.oil,
        wallStreetLevel: stats.upgradeLevels.wallStreet,
        goldLevel: stats.upgradeLevels.gold,
        diamondLevel: stats.upgradeLevels.diamond
      });

      return this.findByUserId(userId);
    },
    close() {
      db.close();
    }
  };
}

module.exports = {
  createSqliteSaveRepository,
  UPGRADE_LEVEL_COLUMNS
};
