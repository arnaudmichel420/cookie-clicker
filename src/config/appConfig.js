const path = require("path");

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
  getPort,
  getPublicPath,
  getViewsPath
};
