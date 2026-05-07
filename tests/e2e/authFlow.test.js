const { spawn } = require("node:child_process");
const { execFileSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");
const { DEFAULT_USER } = require("../../src/repositories/sqliteUserRepository");

const PORT = 3210;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const JWT_PASSPHRASE = "test-jwt-passphrase";

function createTempDbPath() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), "cookie-clicker-e2e-")), "game.sqlite");
}

function createJwtKeyFiles(dbPath) {
  const keyDir = path.dirname(dbPath);
  const privateKeyPath = path.join(keyDir, "jwt-private.pem");
  const publicKeyPath = path.join(keyDir, "jwt-public.pem");

  if (fs.existsSync(privateKeyPath) && fs.existsSync(publicKeyPath)) {
    return {
      privateKeyPath,
      publicKeyPath
    };
  }

  const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem",
      cipher: "aes-256-cbc",
      passphrase: JWT_PASSPHRASE
    },
    publicKeyEncoding: {
      type: "spki",
      format: "pem"
    }
  });

  fs.writeFileSync(privateKeyPath, privateKey);
  fs.writeFileSync(publicKeyPath, publicKey);

  return {
    privateKeyPath,
    publicKeyPath
  };
}

function startServer(dbPath) {
  const jwtKeys = createJwtKeyFiles(dbPath);

  return new Promise((resolve, reject) => {
    const server = spawn("node", ["src/server.js"], {
      env: {
        ...process.env,
        DB_PATH: dbPath,
        JWT_PRIVATE_KEY_PASSPHRASE: JWT_PASSPHRASE,
        JWT_PRIVATE_KEY_PATH: jwtKeys.privateKeyPath,
        JWT_PUBLIC_KEY_PATH: jwtKeys.publicKeyPath,
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

function seedDefaultUser(dbPath) {
  execFileSync("npm", ["run", "seed"], {
    env: {
      ...process.env,
      DB_PATH: dbPath
    },
    stdio: "pipe"
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

function decodeJwtPart(token, index) {
  return JSON.parse(Buffer.from(token.split(".")[index], "base64url").toString("utf8"));
}

describe("authentification utilisateur", () => {
  const dbPath = createTempDbPath();
  let server;

  beforeAll(async () => {
    seedDefaultUser(dbPath);
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
    expect(body.token.split(".")).toHaveLength(3);
    expect(decodeJwtPart(body.token, 0)).toEqual({
      alg: "RS256",
      typ: "JWT"
    });
    expect(decodeJwtPart(body.token, 1)).toMatchObject({
      email,
      iss: "cookie-clicker"
    });
    expect(decodeJwtPart(body.token, 1).exp - decodeJwtPart(body.token, 1).iat).toBe(86400);
  });

  it("permet de se connecter avec l'utilisateur seed par defaut", async () => {
    // Given : la base SQLite a ete initialisee au demarrage du serveur
    const storedUser = findStoredUser(dbPath, DEFAULT_USER.email);

    // When : l'utilisateur par defaut se connecte avec ses identifiants
    const loginResponse = await login(DEFAULT_USER.email, DEFAULT_USER.password);
    const body = await loginResponse.json();

    // Then : le compte seed existe en base et l'authentification fonctionne
    expect(storedUser.email).toBe(DEFAULT_USER.email);
    expect(loginResponse.status).toBe(200);
    expect(body.user.email).toBe(DEFAULT_USER.email);
    expect(body.token).toEqual(expect.any(String));
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

  it("deconnecte l'utilisateur cote client sans stocker de session serveur", async () => {
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

    // Then : la demande de deconnexion est acceptee
    expect(logoutResponse.status).toBe(200);

    // Un JWT stateless reste cryptographiquement valide jusqu'a expiration.
    // Le client doit donc l'effacer de son stockage local apres /logout.
    const sessionResponse = await fetch(`${BASE_URL}/session`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const body = await sessionResponse.json();

    expect(body.isAuthenticated).toBe(true);
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

  it("conserve l'acces au jeu apres refresh avec le token persistant", async () => {
    // Given : un utilisateur est connecte et son token est conserve par le navigateur
    const email = `page-refresh-${Date.now()}@gmail.com`;
    await register(email);
    const loginResponse = await login(email);
    const { token } = await loginResponse.json();

    // When : il rafraichit la racine sans renvoyer manuellement le header Authorization
    const refreshResponse = await fetch(BASE_URL, {
      headers: {
        Cookie: `auth_token=${encodeURIComponent(token)}`
      },
      redirect: "manual"
    });
    const html = await refreshResponse.text();

    // Then : il reste authentifie et voit directement le jeu
    expect(refreshResponse.status).toBe(200);
    expect(html).toContain("Sovereign Clicker");
    expect(html).toContain("Trump dollars");
  });

  it("conserve la session JWT apres redemarrage du serveur", async () => {
    // Given : un utilisateur est connecte avec un JWT stocke en base et dans son navigateur
    const email = `jwt-restart-${Date.now()}@gmail.com`;
    await register(email);
    const loginResponse = await login(email);
    const { token } = await loginResponse.json();

    // When : le serveur redemarre en conservant la meme base SQLite
    await stopServer(server);
    server = await startServer(dbPath);
    const sessionResponse = await fetch(`${BASE_URL}/session`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const body = await sessionResponse.json();

    // Then : la cle publique verifie encore le JWT et l'utilisateur reste connecte
    expect(sessionResponse.status).toBe(200);
    expect(body.isAuthenticated).toBe(true);
    expect(body.user.email).toBe(email);
  });

  it("redirige un utilisateur non connecte de la racine vers la connexion", async () => {
    // Given : un utilisateur arrive sur le site sans etre connecte
    // When : il tente d'ouvrir la racine qui correspond au jeu
    const response = await fetch(BASE_URL, {
      redirect: "manual"
    });

    // Then : il ne voit pas le jeu et part vers la page de connexion
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/login");
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
