const express = require("express");
const dotenv = require("dotenv");
const { getPublicPath, getViewsPath } = require("./config/appConfig");
const { createUserRepository } = require("./repositories/inMemoryUserRepository");
const { createAuthService } = require("./services/authService");
const { createPasswordService } = require("./services/passwordService");
const { createTokenService } = require("./services/tokenService");
const { createAuthRouter } = require("./routes/authRoutes");
const { createPageRouter } = require("./routes/pageRoutes");

dotenv.config();

function createApp() {
  const app = express();
  const authService = createAuthService({
    userRepository: createUserRepository(),
    passwordService: createPasswordService(),
    tokenService: createTokenService()
  });

  app.set("view engine", "ejs");
  app.set("views", getViewsPath());

  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(express.static(getPublicPath()));

  app.use(createPageRouter());
  app.use(createAuthRouter(authService));

  return app;
}

module.exports = {
  createApp
};
