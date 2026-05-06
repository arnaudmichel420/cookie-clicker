const { AUTH_ERRORS } = require("../constants/auth");
const { getDbPath } = require("../config/appConfig");
const { createSqliteUserRepository } = require("../repositories/sqliteUserRepository");
const { normalizeEmail } = require("../utils/auth");
const { createPasswordService } = require("./passwordService");
const { createTokenService } = require("./tokenService");

function createAuthService({
  userRepository = createSqliteUserRepository(getDbPath()),
  passwordService = createPasswordService(),
  tokenService = createTokenService()
} = {}) {
  return {
    async register({ email, password }) {
      const normalizedEmail = normalizeEmail(email);

      if (!normalizedEmail) {
        throw new Error(AUTH_ERRORS.missingEmail);
      }

      if (!password) {
        throw new Error(AUTH_ERRORS.missingPassword);
      }

      const existingUser = await userRepository.findByEmail(normalizedEmail);

      if (existingUser) {
        throw new Error(AUTH_ERRORS.duplicateEmail);
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
        throw new Error(AUTH_ERRORS.invalidEmail);
      }

      const isPasswordValid = await passwordService.verify(password, user.passwordHash);

      if (!isPasswordValid) {
        throw new Error(AUTH_ERRORS.invalidPassword);
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
  createSqliteUserRepository
};
