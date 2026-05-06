const crypto = require("node:crypto");

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim() : "";
}

function createUserRepository(seedUsers = []) {
  const records = seedUsers.map((user, index) => ({
    id: user.id ?? index + 1,
    token: user.token ?? null,
    ...user
  }));

  return {
    async create(user) {
      const createdUser = {
        id: records.length + 1,
        token: null,
        ...user
      };

      records.push(createdUser);

      return createdUser;
    },
    async findByEmail(email) {
      return records.find((user) => user.email === email) ?? null;
    },
    async findByToken(token) {
      return records.find((user) => user.token === token) ?? null;
    },
    async removeToken(userId) {
      const user = records.find((record) => record.id === userId);

      if (user) {
        user.token = null;
      }
    },
    async saveToken(userId, token) {
      const user = records.find((record) => record.id === userId);

      if (user) {
        user.token = token;
      }
    }
  };
}

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

function createTokenService() {
  const activeTokens = new Set();

  return {
    async generate() {
      const token = crypto.randomBytes(24).toString("hex");
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

function createAuthService({
  userRepository = createUserRepository(),
  passwordService = createPasswordService(),
  tokenService = createTokenService()
} = {}) {
  return {
    async register({ email, password }) {
      const normalizedEmail = normalizeEmail(email);

      if (!normalizedEmail) {
        throw new Error("Adresse email obligatoire");
      }

      if (!password) {
        throw new Error("Mot de passe obligatoire");
      }

      const existingUser = await userRepository.findByEmail(normalizedEmail);

      if (existingUser) {
        throw new Error("Adresse email déjà utilisé");
      }

      const passwordHash = await passwordService.hash(password);
      const createdUser = await userRepository.create({
        email: normalizedEmail,
        passwordHash
      });

      return {
        id: createdUser.id,
        email: createdUser.email
      };
    },

    async login({ email, password }) {
      const normalizedEmail = normalizeEmail(email);
      const user = await userRepository.findByEmail(normalizedEmail);

      if (!user) {
        throw new Error("Adresse email invalide");
      }

      const isPasswordValid = await passwordService.verify(password, user.passwordHash);

      if (!isPasswordValid) {
        throw new Error("Mot de passe invalide");
      }

      const token = await tokenService.generate(user);
      await userRepository.saveToken(user.id, token);

      return {
        token,
        user: {
          id: user.id,
          email: user.email
        }
      };
    },

    async logout(userId, token) {
      await userRepository.removeToken(userId);
      await tokenService.revoke(token);
    },

    async resolveSession(token) {
      if (!token) {
        return {
          clearToken: false,
          user: null
        };
      }

      const verifiedToken = await tokenService.verify(token);

      if (!verifiedToken) {
        return {
          clearToken: true,
          user: null
        };
      }

      const user = await userRepository.findByToken(verifiedToken);

      if (!user) {
        return {
          clearToken: true,
          user: null
        };
      }

      return {
        clearToken: false,
        user: {
          id: user.id,
          email: user.email
        }
      };
    }
  };
}

module.exports = {
  createAuthService,
  createPasswordService,
  createTokenService,
  createUserRepository
};
