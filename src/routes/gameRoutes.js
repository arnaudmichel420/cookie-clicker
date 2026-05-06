const express = require("express");
const { createGameController } = require("../controllers/gameController");

function createGameRouter({ authService, gameService }) {
  const router = express.Router();
  const gameController = createGameController({ authService, gameService });

  router.get("/game", gameController.page);
  router.get("/game/state", gameController.state);
  router.post("/game/click", gameController.click);

  return router;
}

module.exports = {
  createGameRouter
};
