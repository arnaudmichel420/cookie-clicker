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

function readCookieToken(req) {
  const cookieHeader = req.get("Cookie") ?? "";
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const tokenCookie = cookies.find((cookie) => cookie.startsWith("auth_token="));

  if (!tokenCookie) {
    return null;
  }

  return decodeURIComponent(tokenCookie.slice("auth_token=".length)) || null;
}

function readAuthToken(req) {
  return readBearerToken(req) ?? readCookieToken(req);
}

module.exports = {
  readAuthToken,
  normalizeEmail,
  readBearerToken
};
