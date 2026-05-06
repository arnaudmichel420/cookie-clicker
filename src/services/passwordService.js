const crypto = require("node:crypto");

function createPasswordService() {
  return {
    async hash(password) {
      return crypto.createHash("sha256").update(password).digest("hex");
    },
    async verify(password, passwordHash) {
      const hashedPassword = await this.hash(password);

      return hashedPassword === passwordHash;
    }
  };
}

module.exports = {
  createPasswordService
};
