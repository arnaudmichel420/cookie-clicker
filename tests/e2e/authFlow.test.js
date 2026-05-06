const { spawn } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");

const PORT = 3210;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function createTempDbPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "cookie-clicker-e2e-")), "game.sqlite");
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
  const db = new Database(dbPath, {
    readonly: true
  });
  const user = db
    .prepare("SELECT id, email, password_hash, token FROM users WHERE email = ?")
    .get(email);

  db.close();

  return user;
}

describe("authentification utilisateur", () => {
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

  it("cree un compte, connecte l'utilisateur et renvoie un token", async () => {
    // Given : un utilisateur arrive sur le site
    const email = `john-${Date.now()}@gmail.com`;
    const password = "Password123!";

    // When : il cree un compte puis se connecte avec ses identifiants
    const registerResponse = await register(email, password);
    expect(registerResponse.status).toBe(201);

    const loginResponse = await login(email, password);
    const body = await loginResponse.json();

    // Then : l'utilisateur recoit un token et accede a l'application
    expect(loginResponse.status).toBe(200);
    expect(body.token).toEqual(expect.any(String));
    expect(body.token.length).toBeGreaterThan(0);
  });

  it("stocke le compte utilisateur dans la base SQLite", async () => {
    // Given : un utilisateur cree un compte avec une adresse email unique
    const email = `stored-${Date.now()}@gmail.com`;

    // When : l'inscription est validee par l'API
    const registerResponse = await register(email);
    const storedUser = findStoredUser(dbPath, email);

    // Then : l'utilisateur est bien present dans la table users
    expect(registerResponse.status).toBe(201);
    expect(storedUser.email).toBe(email);
    expect(storedUser.password_hash).toEqual(expect.any(String));
    expect(storedUser.password_hash).not.toBe("Password123!");
  });

  it("retrouve un compte stocke en base apres redemarrage du serveur", async () => {
    // Given : un compte utilisateur a ete enregistre dans SQLite
    const email = `restart-${Date.now()}@gmail.com`;
    await register(email);

    // When : le serveur redemarre en conservant le meme fichier de base
    await stopServer(server);
    server = await startServer(dbPath);
    const loginResponse = await login(email);
    const body = await loginResponse.json();

    // Then : l'utilisateur peut encore se connecter avec son compte persiste
    expect(loginResponse.status).toBe(200);
    expect(body.user.email).toBe(email);
    expect(body.token).toEqual(expect.any(String));
  });

  it("deconnecte l'utilisateur et retire son token", async () => {
    // Given : un utilisateur est connecte
    const email = `logout-${Date.now()}@gmail.com`;
    await register(email);
    const loginResponse = await login(email);
    const { token } = await loginResponse.json();

    // When : il clique sur se deconnecter
    const logoutResponse = await fetch(`${BASE_URL}/logout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Then : son token est retire et il est invite a se reconnecter
    expect(logoutResponse.status).toBe(200);

    const sessionResponse = await fetch(`${BASE_URL}/session`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const body = await sessionResponse.json();

    expect(body.isAuthenticated).toBe(false);
  });

  it("conserve la connexion apres un refresh avec un token valide", async () => {
    // Given : un utilisateur est connecte avec un token valide
    const email = `refresh-${Date.now()}@gmail.com`;
    await register(email);
    const loginResponse = await login(email);
    const { token } = await loginResponse.json();

    // When : il rafraichit la page
    const sessionResponse = await fetch(`${BASE_URL}/session`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const body = await sessionResponse.json();

    // Then : il reste connecte et accede toujours a l'application
    expect(sessionResponse.status).toBe(200);
    expect(body.isAuthenticated).toBe(true);
  });

  it("invite un utilisateur non connecte a se connecter", async () => {
    // Given : un utilisateur arrive sur le site sans etre connecte
    // When : la page se charge
    const response = await fetch(BASE_URL);
    const html = await response.text();

    // Then : il est invite a se connecter
    expect(response.status).toBe(200);
    expect(html).toContain("Se connecter");
  });

  it("refuse la creation d'un compte avec un email deja utilise", async () => {
    // Given : un compte existe deja avec une adresse email donnee
    const email = `duplicate-${Date.now()}@gmail.com`;
    await register(email);

    // When : un utilisateur tente de creer un deuxieme compte avec la meme adresse email
    const duplicateResponse = await register(email);
    const body = await duplicateResponse.json();

    // Then : le message d'erreur est affiche
    expect(duplicateResponse.status).toBe(400);
    expect(body.error).toBe("Adresse email déjà utilisé");
  });
});
