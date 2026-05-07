const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const DEFAULT_USER = {
  email: "JohnDOE1@test.com",
  password: "JohnDoe1234*"
};

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    token: row.token
  };
}

function createSqliteUserRepository(dbPath) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      token TEXT UNIQUE,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const statements = {
    create: db.prepare(`
      INSERT INTO users (email, password_hash)
      VALUES (@email, @passwordHash)
    `),
    seedDefaultUser: db.prepare(`
      INSERT OR IGNORE INTO users (email, password_hash)
      VALUES (@email, @passwordHash)
    `),
    findByEmail: db.prepare(`
      SELECT id, email, password_hash, token
      FROM users
      WHERE email = ?
    `),
    findByToken: db.prepare(`
      SELECT id, email, password_hash, token
      FROM users
      WHERE token = ?
    `),
    findById: db.prepare(`
      SELECT id, email, password_hash, token
      FROM users
      WHERE id = ?
    `),
    removeToken: db.prepare(`
      UPDATE users
      SET token = NULL
      WHERE id = ?
    `),
    saveToken: db.prepare(`
      UPDATE users
      SET token = ?
      WHERE id = ?
    `)
  };

  return {
    async create(user) {
      const result = statements.create.run(user);

      return mapUser(statements.findById.get(result.lastInsertRowid));
    },
    async findByEmail(email) {
      return mapUser(statements.findByEmail.get(email));
    },
    async findById(userId) {
      return mapUser(statements.findById.get(userId));
    },
    async findByToken(token) {
      return mapUser(statements.findByToken.get(token));
    },
    async removeToken(userId) {
      statements.removeToken.run(userId);
    },
    async saveToken(userId, token) {
      statements.saveToken.run(token, userId);
    },
    async seedDefaultUser() {
      const result = statements.seedDefaultUser.run({
        email: DEFAULT_USER.email,
        passwordHash: hashPassword(DEFAULT_USER.password)
      });
      const user = await this.findByEmail(DEFAULT_USER.email);

      return {
        created: result.changes > 0,
        user
      };
    },
    close() {
      db.close();
    }
  };
}

module.exports = {
  DEFAULT_USER,
  createSqliteUserRepository
};
