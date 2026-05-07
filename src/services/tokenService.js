const crypto = require("node:crypto");
const { AUTH_TOKEN } = require("../constants/auth");

function createTokenService() {
  return {
    async generate() {
      const token = crypto.randomBytes(AUTH_TOKEN.byteLength).toString("hex");

      return token;
    },
    async verify(token) {
      if (!token) {
        return null;
      }

      return token;
    },
    async revoke() {
      return undefined;
    }
  };
}

module.exports = {
  createTokenService
};
