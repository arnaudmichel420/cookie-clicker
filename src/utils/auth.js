const { AUTH_TOKEN } = require("../constants/auth");

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim() : "";
}

function readBearerToken(req) {
  const authorization = req.get("Authorization") ?? "";

  if (!authorization.startsWith(AUTH_TOKEN.prefix)) {
    return null;
  }

  return authorization.slice(AUTH_TOKEN.prefix.length).trim() || null;
}

module.exports = {
  normalizeEmail,
  readBearerToken
};
