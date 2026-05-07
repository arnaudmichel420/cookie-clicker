const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");

const PORT = 3212;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function createTempDbPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "cookie-clicker-miscs-e2e-")), "game.sqlite");
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

function findStoredUser(dbPath, email) {
  const db = new Database(dbPath);
  const user = db.prepare("SELECT id, email FROM users WHERE email = ?").get(email);

  db.close();

  return user;
}

function setGameSave(dbPath, userId, overrides = {}) {
  const db = new Database(dbPath);

  db.prepare(
    `
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
    `
  ).run({
    userId,
    cookies: overrides.cookies ?? 0,
    cookiesPerSecond: overrides.cookiesPerSecond ?? 0,
    cookiesPerClick: overrides.cookiesPerClick ?? 1,
    pickupLevel: overrides.pickupLevel ?? 0,
    oilLevel: overrides.oilLevel ?? 0,
    wallStreetLevel: overrides.wallStreetLevel ?? 0,
    goldLevel: overrides.goldLevel ?? 0,
    diamondLevel: overrides.diamondLevel ?? 0,
    lastCollectedAt: overrides.lastCollectedAt ?? "2026-05-07T10:00:00.000Z"
  });

  db.close();
}

describe("miscs", () => {
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
    const email = `miscs-${Date.now()}-${Math.random()}@gmail.com`;

    await register(email);
    const loginResponse = await login(email);
    const session = await loginResponse.json();

    return {
      email,
      token: session.token,
      user: findStoredUser(dbPath, email)
    };
  }

  it("E2E Miscs 1 - formate les montants affiches", async () => {
    // Given : un utilisateur est connecté et possède un montant de cookies supérieur ou égal à 1000
    const { token, user } = await createAuthenticatedUser();
    setGameSave(dbPath, user.id, {
      cookies: 1500
    });

    // When : le compteur affiche les montants du joueur
    const response = await fetch(BASE_URL, {
      headers: {
        Cookie: `auth_token=${encodeURIComponent(token)}`
      }
    });
    const html = await response.text();

    // Then : les montants sont formatés avec l'unité adaptée, par exemple 1500 devient 1.5K
    expect(response.status).toBe(200);
    expect(html).toContain("$1.5K");
    expect(html).not.toContain("$1500");
  });

  it("E2E Miscs 2 - expose un bouton de log-out fonctionnel", async () => {
    // Given : un utilisateur est connecté et arrive sur la page du jeu
    const { token } = await createAuthenticatedUser();

    // When : il consulte la page du jeu
    const response = await fetch(BASE_URL, {
      headers: {
        Cookie: `auth_token=${encodeURIComponent(token)}`
      }
    });
    const html = await response.text();
    const gamePageScriptResponse = await fetch(`${BASE_URL}/scripts/game-page.js`);
    const gamePageScript = await gamePageScriptResponse.text();

    // Then : le bouton de log-out supprime la session et redirige vers la page de connexion
    expect(response.status).toBe(200);
    expect(html).toContain('id="logout-button"');
    expect(html).toContain('class="shop-logout"');
    expect(html).toContain("ph-sign-out");
    expect(html).toContain("Déconnexion");
    expect(html).not.toContain("ph-storefront");
    expect(html).toContain('<script src="/scripts/ui-helpers.js"></script>');
    expect(html.indexOf("/scripts/ui-helpers.js")).toBeLessThan(
      html.indexOf("/scripts/game-page.js")
    );
    expect(gamePageScript).toContain("authClient.logout()");
    expect(gamePageScript).toContain("redirectTo(window.AUTH_ROUTES.login)");
  });

  it("E2E Miscs 3 - ouvre la bonne categorie d'upgrade via les raccourcis", async () => {
    // Given : un utilisateur est connecté et voit la sidebar avec les raccourcis d'upgrades
    const { token } = await createAuthenticatedUser();

    // When : la page du jeu est chargée
    const response = await fetch(BASE_URL, {
      headers: {
        Cookie: `auth_token=${encodeURIComponent(token)}`
      }
    });
    const html = await response.text();
    const gamePageScriptResponse = await fetch(`${BASE_URL}/scripts/game-page.js`);
    const gamePageScript = await gamePageScriptResponse.text();

    // Then : chaque raccourci cible la categorie d'upgrade correspondante
    expect(response.status).toBe(200);
    expect(html).toContain('id="shop-filter-auto"');
    expect(html).toContain("ph-timer");
    expect(html).toContain('data-upgrade-filter="auto-click"');
    expect(html).toContain('data-upgrade-filter-kind="auto-click"');
    expect(html).toContain('id="shop-filter-click"');
    expect(html).toContain("ph-hand-tap");
    expect(html).toContain('data-upgrade-filter="boost-click"');
    expect(html).toContain('data-upgrade-filter-kind="boost-click"');
    expect(gamePageScript).toContain("applyUpgradeFilter(filterButton.dataset.upgradeFilter)");
    expect(gamePageScript).toContain("card.hidden = !shouldShow");
  });

  it("E2E Miscs 4 - declenche les sons pendant les animations d'avion et de missile", async () => {
    // Given : un utilisateur est connecté et déclenche une animation d'avion de chasse ou de missile
    const constantsResponse = await fetch(`${BASE_URL}/scripts/constants.js`);
    const constantsScript = await constantsResponse.text();
    const gameEffectsResponse = await fetch(`${BASE_URL}/scripts/game-effects.js`);
    const gameEffectsScript = await gameEffectsResponse.text();
    const soundEffectsResponse = await fetch(`${BASE_URL}/scripts/sound-effects.js`);
    const soundEffectsScript = await soundEffectsResponse.text();

    // When : l'animation démarre
    // Then : le son associé à cette animation est joué correctement
    expect(constantsResponse.status).toBe(200);
    expect(gameEffectsResponse.status).toBe(200);
    expect(soundEffectsResponse.status).toBe(200);
    expect(constantsScript).toContain("fighter");
    expect(constantsScript).toContain("missile");
    expect(soundEffectsScript).toContain("playFighterSound");
    expect(soundEffectsScript).toContain("playMissileSound");
    expect(gameEffectsScript).toContain("playFighterSound()");
    expect(gameEffectsScript).toContain("playMissileSound()");
  });
});
