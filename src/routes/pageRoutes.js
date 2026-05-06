const express = require("express");
const { renderPage } = require("../controllers/pageController");

function createPageRouter() {
  const router = express.Router();

  router.get("/login", renderPage("login"));
  router.get("/register", renderPage("register"));
  router.get("/account", renderPage("account"));

  return router;
}

module.exports = {
  createPageRouter
};
