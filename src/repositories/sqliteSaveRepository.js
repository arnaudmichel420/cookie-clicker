const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

function mapSave(row) {
  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    cookies: row.trump_dollars,
    cookiesPerSecond: row.trump_dollars_per_second
  };
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
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const statements = {
    findByUserId: db.prepare(`
      SELECT user_id, trump_dollars, trump_dollars_per_second
      FROM game_saves
      WHERE user_id = ?
    `),
    save: db.prepare(`
      INSERT INTO game_saves (user_id, trump_dollars, trump_dollars_per_second, updated_at)
      VALUES (@userId, @cookies, @cookiesPerSecond, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        trump_dollars = excluded.trump_dollars,
        trump_dollars_per_second = excluded.trump_dollars_per_second,
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
        cookiesPerSecond: stats.cookiesPerSecond
      });

      return this.findByUserId(userId);
    },
    close() {
      db.close();
    }
  };
}

module.exports = {
  createSqliteSaveRepository
};
