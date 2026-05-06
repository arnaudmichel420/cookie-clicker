const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const {
  createAuthService,
  createPasswordService,
  createTokenService,
  createUserRepository
} = require("./services/authService");

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const authService = createAuthService({
  userRepository: createUserRepository(),
  passwordService: createPasswordService(),
  tokenService: createTokenService()
});

function readBearerToken(req) {
  const authorization = req.get("Authorization") ?? "";

  if (!authorization.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("pages/home", {
    title: "Authentification utilisateur",
    message: "Choisissez une page dédiée pour créer votre compte, vous connecter ou retrouver votre session."
  });
});

app.get("/login", (req, res) => {
  res.render("pages/login", {
    title: "Connexion",
    message: "Entrez vos identifiants pour accéder à votre espace."
  });
});

app.get("/register", (req, res) => {
  res.render("pages/register", {
    title: "Inscription",
    message: "Créez votre compte pour conserver votre session d'une visite à l'autre."
  });
});

app.get("/account", (req, res) => {
  res.render("pages/account", {
    title: "Mon compte",
    message: "Retrouvez ici votre session active et déconnectez-vous proprement."
  });
});

app.post("/register", async (req, res) => {
  try {
    const user = await authService.register(req.body);

    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({
      error: error.message
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const session = await authService.login(req.body);

    res.status(200).json(session);
  } catch (error) {
    res.status(401).json({
      error: error.message
    });
  }
});

app.post("/logout", async (req, res) => {
  const token = readBearerToken(req);
  const session = await authService.resolveSession(token);

  if (!session.user) {
    return res.status(200).json({
      success: true
    });
  }

  await authService.logout(session.user.id, token);

  return res.status(200).json({
    success: true
  });
});

app.get("/session", async (req, res) => {
  const token = readBearerToken(req);
  const session = await authService.resolveSession(token);

  return res.status(200).json({
    clearToken: session.clearToken,
    isAuthenticated: Boolean(session.user),
    user: session.user
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
