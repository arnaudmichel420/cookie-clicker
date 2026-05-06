const path = require("path");

function getDbPath() {
  return process.env.DB_PATH || path.join(process.cwd(), "db", "game.sqlite");
}

function getPort() {
  return Number(process.env.PORT) || 3000;
}

function getViewsPath() {
  return path.join(__dirname, "..", "views");
}

function getPublicPath() {
  return path.join(__dirname, "..", "public");
}

module.exports = {
  getDbPath,
  getPort,
  getPublicPath,
  getViewsPath
};
