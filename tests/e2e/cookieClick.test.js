const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");

const PORT = 3211;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function createTempDbPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "cookie-clicker-game-e2e-")), "game.sqlite");
}

function startServer(dbPath) {
  return new Promise((resolve, reject) => {
    const server = spawn("node", ["src/server.js"], {
      env: {
        ...process.env,
        DB_PATH: dbPath,
        PORT: String(PORT)
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    const timeout = setTimeout(() => {
      server.kill();
      reject(new Error("Le serveur n'a pas demarre avant le timeout."));
    }, 5000);

    server.stdout.on("data", (data) => {
      if (data.toString().includes(`http://localhost:${PORT}`)) {
        clearTimeout(timeout);
        resolve(server);
      }
    });

    server.stderr.on("data", (data) => {
      clearTimeout(timeout);
      server.kill();
      reject(new Error(data.toString()));
    });

    server.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function stopServer(server) {
  return new Promise((resolve) => {
    server.once("exit", resolve);
    server.kill();
  });
}

function findStoredGameSave(dbPath, email) {
  const db = new Database(dbPath, {
    readonly: true
  });
  const save = db
    .prepare(
      `
        SELECT
          game_saves.user_id,
          game_saves.trump_dollars,
          game_saves.trump_dollars_per_second,
          game_saves.trump_dollars_per_click,
          game_saves.pickup_level,
          game_saves.gold_level
        FROM game_saves
        INNER JOIN users ON users.id = game_saves.user_id
        WHERE users.email = ?
      `
    )
    .get(email);

  db.close();

  return save;
}

describe("cookie qui click", () => {
  const dbPath = createTempDbPath();
  let server;

  beforeAll(async () => {
    server = await startServer(dbPath);
  });

  afterAll(async () => {
    await stopServer(server);
  });

  async function register(email, password = "Password123!") {
    return fetch(`${BASE_URL}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });
  }

  async function login(email, password = "Password123!") {
    return fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });
  }

  async function createAuthenticatedUser() {
    const email = `cookie-${Date.now()}-${Math.random()}@gmail.com`;

    await register(email);
    const loginResponse = await login(email);
    const session = await loginResponse.json();

    return {
      email,
      token: session.token
    };
  }

  async function getGameState(token) {
    return fetch(`${BASE_URL}/game/state`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  async function clickCookie(token) {
    return fetch(`${BASE_URL}/game/click`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  async function purchaseUpgrade(token, upgradeKey) {
    return fetch(`${BASE_URL}/game/upgrades/${upgradeKey}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  async function earnCookies(token, amount) {
    for (let index = 0; index < amount; index += 1) {
      if (index > 0 && index % 10 === 0) {
        await new Promise((resolve) => {
          setTimeout(resolve, 1100);
        });
      }

      const response = await clickCookie(token);
      expect(response.status).toBe(200);
    }
  }

  it("E2E 0 - affiche le jeu sur la racine pour un utilisateur connecte", async () => {
    const { token } = await createAuthenticatedUser();

    const response = await fetch(BASE_URL, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Sovereign Clicker");
    expect(html).toContain("Améliorations");
    expect(html).toContain("Auto-click");
  });

  it("E2E 1 - Achat d'une upgrade avec fonds suffisants", async () => {
    const { token } = await createAuthenticatedUser();

    await earnCookies(token, 20);

    const beforePurchaseResponse = await getGameState(token);
    const beforePurchaseState = await beforePurchaseResponse.json();
    const purchaseResponse = await purchaseUpgrade(token, "pickup");
    const purchaseState = await purchaseResponse.json();

    expect(beforePurchaseResponse.status).toBe(200);
    expect(purchaseResponse.status).toBe(200);
    expect(beforePurchaseState.cookies).toBe(20);
    expect(purchaseState.cookies).toBe(0);
    expect(purchaseState.cookiesPerSecond).toBe(1);
    expect(purchaseState.upgradeLevels.pickup).toBe(1);
  });

  it("E2E 2 - Achat d'une upgrade sans fonds suffisants", async () => {
    const { token } = await createAuthenticatedUser();

    const response = await purchaseUpgrade(token, "pickup");
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Fonds insuffisants");
  });

  it("E2E 3 - Persistance des upgrades achetées", async () => {
    const { token } = await createAuthenticatedUser();

    await earnCookies(token, 30);

    const purchaseResponse = await purchaseUpgrade(token, "gold");
    const purchaseState = await purchaseResponse.json();
    const refreshedStateResponse = await getGameState(token);
    const refreshedState = await refreshedStateResponse.json();

    expect(purchaseResponse.status).toBe(200);
    expect(refreshedStateResponse.status).toBe(200);
    expect(purchaseState.cookiesPerClick).toBe(2);
    expect(refreshedState.cookiesPerClick).toBe(2);
    expect(refreshedState.upgradeLevels.gold).toBe(1);
  });

  it("E2E 4 - incremente le compteur avec le gain par clic courant", async () => {
    const { token } = await createAuthenticatedUser();

    await earnCookies(token, 30);
    const upgradeResponse = await purchaseUpgrade(token, "gold");
    await new Promise((resolve) => {
      setTimeout(resolve, 1100);
    });
    const clickResponse = await clickCookie(token);
    const clickState = await clickResponse.json();

    expect(upgradeResponse.status).toBe(200);
    expect(clickResponse.status).toBe(200);
    expect(clickState.cookiesPerClick).toBe(2);
  });

  it("E2E 5 - soustrait le prix de l'upgrade achete", async () => {
    const { token } = await createAuthenticatedUser();

    await earnCookies(token, 20);

    const response = await purchaseUpgrade(token, "pickup");
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.cookies).toBe(0);
    expect(body.cookiesPerSecond).toBe(1);
  });

  it("E2E 6 - stocke les upgrades par utilisateur dans SQLite", async () => {
    const firstUser = await createAuthenticatedUser();
    const secondUser = await createAuthenticatedUser();

    await earnCookies(firstUser.token, 20);

    await purchaseUpgrade(firstUser.token, "pickup");

    const firstSave = findStoredGameSave(dbPath, firstUser.email);
    const secondSave = findStoredGameSave(dbPath, secondUser.email);

    expect(firstSave.pickup_level).toBe(1);
    expect(firstSave.trump_dollars_per_second).toBe(1);
    expect(secondSave).toBeUndefined();
  });

  it("E2E 7 - recharge les upgrades depuis SQLite apres redemarrage du serveur", async () => {
    const { email, token } = await createAuthenticatedUser();

    await earnCookies(token, 30);

    await purchaseUpgrade(token, "gold");
    await stopServer(server);
    server = await startServer(dbPath);

    const loginResponse = await login(email);
    const { token: newToken } = await loginResponse.json();
    const stateAfterRestart = await getGameState(newToken);
    const body = await stateAfterRestart.json();

    expect(loginResponse.status).toBe(200);
    expect(stateAfterRestart.status).toBe(200);
    expect(body.cookiesPerClick).toBe(2);
    expect(body.upgradeLevels.gold).toBe(1);
  });

  it(
    "E2E Effets 1 - Effets visuels lors de l'achat d'une upgrade",
    async () => {
      const { token } = await createAuthenticatedUser();

      await earnCookies(token, 70);

      const pickupResponse = await purchaseUpgrade(token, "pickup");
      const pickupBody = await pickupResponse.json();
      const secondPickupResponse = await purchaseUpgrade(token, "pickup");
      const secondPickupBody = await secondPickupResponse.json();

      expect(pickupResponse.status).toBe(200);
      expect(secondPickupResponse.status).toBe(200);
      expect(pickupBody.purchaseEffect).toMatchObject({
        kind: "upgrade-purchase",
        visual: true,
        upgradeKey: "pickup"
      });
      expect(secondPickupBody.purchaseEffect).toMatchObject({
        kind: "upgrade-purchase",
        visual: true,
        upgradeKey: "pickup"
      });
      expect(secondPickupBody.purchaseEffect.intensity).toBeGreaterThan(
        pickupBody.purchaseEffect.intensity
      );
    },
    15000
  );

  it("E2E Effets 2 - Effet visuel lors du clic sur Trump", async () => {
    const { token } = await createAuthenticatedUser();

    const clickResponse = await clickCookie(token);
    const clickBody = await clickResponse.json();

    expect(clickResponse.status).toBe(200);
    expect(clickBody.shouldAnimate).toBe(true);
    expect(clickBody.clickEffect).toMatchObject({
      kind: "trump-click",
      visual: true
    });
  });

  it("E2E Effets 3 - Cumul des effets sonores lors de spams de clics", async () => {
    const { token } = await createAuthenticatedUser();

    const firstClickResponse = await clickCookie(token);
    const secondClickResponse = await clickCookie(token);
    const thirdClickResponse = await clickCookie(token);
    const firstClickBody = await firstClickResponse.json();
    const secondClickBody = await secondClickResponse.json();
    const thirdClickBody = await thirdClickResponse.json();

    expect(firstClickResponse.status).toBe(200);
    expect(secondClickResponse.status).toBe(200);
    expect(thirdClickResponse.status).toBe(200);
    expect(firstClickBody.clickEffect.sound).toEqual({
      key: "trump-click",
      stackable: true
    });
    expect(secondClickBody.clickEffect.sound).toEqual({
      key: "trump-click",
      stackable: true
    });
    expect(thirdClickBody.clickEffect.sound).toEqual({
      key: "trump-click",
      stackable: true
    });
  });
});
