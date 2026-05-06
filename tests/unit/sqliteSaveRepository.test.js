const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createSqliteSaveRepository } = require("../../src/repositories/sqliteSaveRepository");

function createTempDbPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "cookie-clicker-save-")), "game.sqlite");
}

describe("sqliteSaveRepository", () => {
  it("sauvegarde les trump dollars d'un utilisateur dans SQLite", async () => {
    const dbPath = createTempDbPath();
    const repository = createSqliteSaveRepository(dbPath);

    const save = await repository.save(1, {
      cookies: 12,
      cookiesPerSecond: 3
    });

    expect(save).toEqual({
      userId: 1,
      cookies: 12,
      cookiesPerSecond: 3
    });

    repository.close();
  });

  it("met a jour la sauvegarde existante du meme utilisateur", async () => {
    const dbPath = createTempDbPath();
    const repository = createSqliteSaveRepository(dbPath);

    await repository.save(1, {
      cookies: 12,
      cookiesPerSecond: 3
    });
    await repository.save(1, {
      cookies: 18,
      cookiesPerSecond: 4
    });

    const save = await repository.findByUserId(1);

    expect(save).toEqual({
      userId: 1,
      cookies: 18,
      cookiesPerSecond: 4
    });

    repository.close();
  });

  it("retrouve les trump dollars apres reouverture de la base", async () => {
    const dbPath = createTempDbPath();
    const firstRepository = createSqliteSaveRepository(dbPath);

    await firstRepository.save(1, {
      cookies: 27,
      cookiesPerSecond: 0
    });
    firstRepository.close();

    const secondRepository = createSqliteSaveRepository(dbPath);
    const save = await secondRepository.findByUserId(1);

    expect(save).toEqual({
      userId: 1,
      cookies: 27,
      cookiesPerSecond: 0
    });

    secondRepository.close();
  });
});
