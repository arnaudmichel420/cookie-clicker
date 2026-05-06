const express = require("express");
const dotenv = require("dotenv");
const { getDbPath, getPublicPath, getViewsPath } = require("./config/appConfig");
const { createSqliteUserRepository } = require("./repositories/sqliteUserRepository");
const { createAuthService } = require("./services/authService");
const { createPasswordService } = require("./services/passwordService");
const { createTokenService } = require("./services/tokenService");
const { createSqliteSaveRepository } = require("./repositories/sqliteSaveRepository");
const { createGameService } = require("./services/gameService");
const { createAuthRouter } = require("./routes/authRoutes");
const { createGameRouter } = require("./routes/gameRoutes");
const { createPageRouter } = require("./routes/pageRoutes");

dotenv.config();

function createApp() {
  const app = express();
  const userRepository = createSqliteUserRepository(getDbPath());
  const tokenService = createTokenService();
  const authService = createAuthService({
    userRepository,
    passwordService: createPasswordService(),
    tokenService
  });
  const gameService = createGameService({
    saveRepository: createSqliteSaveRepository(getDbPath())
  });

  app.set("view engine", "ejs");
  app.set("views", getViewsPath());

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(express.static(getPublicPath()));

  app.use(createPageRouter());
  app.use(createAuthRouter(authService));
  app.use(createGameRouter({ authService, gameService }));

  return app;
}

module.exports = {
  createApp
};
