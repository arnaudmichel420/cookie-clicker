const express = require("express");
const { createAuthController } = require("../controllers/authController");

function createAuthRouter(authService) {
  const router = express.Router();
  const authController = createAuthController(authService);

  router.post("/register", authController.register);
  router.post("/login", authController.login);
  router.post("/logout", authController.logout);
  router.get("/session", authController.session);

  return router;
}

module.exports = {
  createAuthRouter
};
