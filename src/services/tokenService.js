const crypto = require("node:crypto");
const { AUTH_TOKEN } = require("../constants/auth");

function createTokenService() {
  const activeTokens = new Set();

  return {
    async generate() {
      const token = crypto.randomBytes(AUTH_TOKEN.byteLength).toString("hex");
      activeTokens.add(token);

      return token;
    },
    async verify(token) {
      if (!token) {
        return null;
      }

      return activeTokens.has(token) ? token : null;
    },
    async revoke(token) {
      if (token) {
        activeTokens.delete(token);
      }
    }
  };
}

module.exports = {
  createTokenService
};
