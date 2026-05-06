const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");
const { createSqliteSaveRepository } = require("../../src/repositories/sqliteSaveRepository");

function createTempDbPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "cookie-clicker-save-")), "game.sqlite");
}

function findStoredSave(dbPath, userId) {
  const db = new Database(dbPath, {
    readonly: true
  });
  const save = db
    .prepare(
      `
        SELECT
          user_id,
          trump_dollars,
          trump_dollars_per_second,
          trump_dollars_per_click,
          pickup_level,
          oil_level,
          wall_street_level,
          gold_level,
          diamond_level
        FROM game_saves
        WHERE user_id = ?
      `
    )
    .get(userId);

  db.close();

  return save;
}

function createStats(overrides = {}) {
  return {
    cookies: 12,
    cookiesPerSecond: 3,
    cookiesPerClick: 2,
    lastCollectedAt: "2026-05-06T10:00:00.000Z",
    upgradeLevels: {
      pickup: 1,
      oil: 0,
      wallStreet: 0,
      gold: 1,
      diamond: 0
    },
    ...overrides
  };
}

describe("sqliteSaveRepository", () => {
  it("sauvegarde les trump dollars et les upgrades d'un utilisateur dans SQLite", async () => {
    const dbPath = createTempDbPath();
    const repository = createSqliteSaveRepository(dbPath);

    const save = await repository.save(1, createStats());

    expect(save).toEqual({
      userId: 1,
      cookies: 12,
      cookiesPerSecond: 3,
      cookiesPerClick: 2,
      lastCollectedAt: "2026-05-06T10:00:00.000Z",
      upgradeLevels: {
        pickup: 1,
        oil: 0,
        wallStreet: 0,
        gold: 1,
        diamond: 0
      }
    });
    expect(findStoredSave(dbPath, 1)).toEqual({
      user_id: 1,
      trump_dollars: 12,
      trump_dollars_per_second: 3,
      trump_dollars_per_click: 2,
      pickup_level: 1,
      oil_level: 0,
      wall_street_level: 0,
      gold_level: 1,
      diamond_level: 0
    });

    repository.close();
  });

  it("met a jour la sauvegarde existante du meme utilisateur", async () => {
    const dbPath = createTempDbPath();
    const repository = createSqliteSaveRepository(dbPath);

    await repository.save(1, createStats());
    await repository.save(
      1,
      createStats({
        cookies: 18,
        cookiesPerSecond: 6,
        cookiesPerClick: 6,
        upgradeLevels: {
          pickup: 1,
          oil: 1,
          wallStreet: 0,
          gold: 1,
          diamond: 1
        }
      })
    );

    const save = await repository.findByUserId(1);
    const storedSave = findStoredSave(dbPath, 1);

    expect(save).toEqual({
      userId: 1,
      cookies: 18,
      cookiesPerSecond: 6,
      cookiesPerClick: 6,
      lastCollectedAt: "2026-05-06T10:00:00.000Z",
      upgradeLevels: {
        pickup: 1,
        oil: 1,
        wallStreet: 0,
        gold: 1,
        diamond: 1
      }
    });
    expect(storedSave).toEqual({
      user_id: 1,
      trump_dollars: 18,
      trump_dollars_per_second: 6,
      trump_dollars_per_click: 6,
      pickup_level: 1,
      oil_level: 1,
      wall_street_level: 0,
      gold_level: 1,
      diamond_level: 1
    });

    repository.close();
  });

  it("retrouve les trump dollars et upgrades apres reouverture de la base", async () => {
    const dbPath = createTempDbPath();
    const firstRepository = createSqliteSaveRepository(dbPath);

    await firstRepository.save(
      1,
      createStats({
        cookies: 27,
        cookiesPerSecond: 18,
        cookiesPerClick: 2,
        upgradeLevels: {
          pickup: 0,
          oil: 0,
          wallStreet: 1,
          gold: 1,
          diamond: 0
        }
      })
    );
    firstRepository.close();

    const secondRepository = createSqliteSaveRepository(dbPath);
    const save = await secondRepository.findByUserId(1);

    expect(save).toEqual({
      userId: 1,
      cookies: 27,
      cookiesPerSecond: 18,
      cookiesPerClick: 2,
      lastCollectedAt: "2026-05-06T10:00:00.000Z",
      upgradeLevels: {
        pickup: 0,
        oil: 0,
        wallStreet: 1,
        gold: 1,
        diamond: 0
      }
    });

    secondRepository.close();
  });
});
