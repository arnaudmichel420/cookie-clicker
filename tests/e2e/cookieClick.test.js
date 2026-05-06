const { spawn } = require("node:child_process");

const PORT = 3211;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function startServer() {
  return new Promise((resolve, reject) => {
    const server = spawn("node", ["src/server.js"], {
      env: {
        ...process.env,
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

describe("cookie qui click", () => {
  let server;

  beforeAll(async () => {
    server = await startServer();
  });

  afterAll(() => {
    server.kill();
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

    return session.token;
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

  it("E2E 1 - incremente le compteur d'un cookie apres un clic", async () => {
    // Given : un utilisateur est connecte et arrive sur la page du jeu avec 0 cookie
    const token = await createAuthenticatedUser();
    const initialResponse = await getGameState(token);
    expect(initialResponse.status).toBe(200);
    const initialState = await initialResponse.json();

    // When : il clique une fois sur le cookie central
    const clickResponse = await clickCookie(token);
    expect(clickResponse.status).toBe(200);
    const clickState = await clickResponse.json();

    // Then : le compteur affiche 1 cookie
    expect(initialState.cookies).toBe(0);
    expect(clickState.cookies).toBe(1);
  });

  it("E2E 2 - incremente le compteur de 1 cookie a chaque clic", async () => {
    // Given : un utilisateur est connecte et arrive sur la page du jeu avec 0 cookie
    const token = await createAuthenticatedUser();

    // When : il clique plusieurs fois sur le cookie central
    const firstClick = await clickCookie(token);
    const secondClick = await clickCookie(token);
    const thirdClick = await clickCookie(token);

    // Then : le compteur s'incremente de 1 cookie a chaque clic
    expect(firstClick.status).toBe(200);
    expect(secondClick.status).toBe(200);
    expect(thirdClick.status).toBe(200);
    expect((await firstClick.json()).cookies).toBe(1);
    expect((await secondClick.json()).cookies).toBe(2);
    expect((await thirdClick.json()).cookies).toBe(3);
  });

  it("E2E 3 - demande l'animation du personnage au clic", async () => {
    // Given : un utilisateur est connecte et arrive sur la page du jeu
    const token = await createAuthenticatedUser();

    // When : il clique sur le cookie central
    const clickResponse = await clickCookie(token);
    expect(clickResponse.status).toBe(200);
    const clickState = await clickResponse.json();

    // Then : le personnage joue son animation de clic
    expect(clickState.shouldAnimate).toBe(true);
  });

  it("E2E 4 - affiche le nombre de cookies et les cookies generes par seconde", async () => {
    // Given : un utilisateur est connecte et possede des statistiques de progression
    const token = await createAuthenticatedUser();
    await clickCookie(token);
    await clickCookie(token);

    // When : il arrive sur la page du jeu
    const gameResponse = await fetch(`${BASE_URL}/game`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const html = await gameResponse.text();

    // Then : son nombre de cookies et les cookies generes par seconde sont affiches
    expect(gameResponse.status).toBe(200);
    expect(html).toContain("2 cookies");
    expect(html).toContain("cookies/sec");
  });

  it("E2E 5 - recharge le compteur avec les statistiques stockees en base", async () => {
    // Given : un utilisateur connecte a gagne des cookies en cliquant sur le cookie
    const token = await createAuthenticatedUser();
    await clickCookie(token);
    await clickCookie(token);
    await clickCookie(token);

    // When : il recharge la page du jeu
    const stateAfterRefresh = await getGameState(token);
    expect(stateAfterRefresh.status).toBe(200);
    const body = await stateAfterRefresh.json();

    // Then : le compteur est recharge avec les statistiques stockees en base
    expect(body.cookies).toBe(3);
  });
});
