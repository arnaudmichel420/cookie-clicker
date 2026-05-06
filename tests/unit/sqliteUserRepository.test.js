const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { createSqliteUserRepository } = require("../../src/repositories/sqliteUserRepository");

function createTempDbPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "cookie-clicker-")), "game.sqlite");
}

describe("sqliteUserRepository", () => {
  it("persiste les utilisateurs dans SQLite et les retrouve apres reouverture", async () => {
    const dbPath = createTempDbPath();
    const firstRepository = createSqliteUserRepository(dbPath);

    const user = await firstRepository.create({
      email: "john@gmail.com",
      passwordHash: "hashed-password"
    });
    await firstRepository.saveToken(user.id, "persisted-token");
    firstRepository.close();

    const secondRepository = createSqliteUserRepository(dbPath);
    const persistedUser = await secondRepository.findByEmail("john@gmail.com");
    const userByToken = await secondRepository.findByToken("persisted-token");

    expect(persistedUser).toEqual({
      id: user.id,
      email: "john@gmail.com",
      passwordHash: "hashed-password",
      token: "persisted-token"
    });
    expect(userByToken.email).toBe("john@gmail.com");

    secondRepository.close();
  });
});
