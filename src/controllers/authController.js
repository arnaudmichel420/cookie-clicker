const { HTTP_STATUS } = require("../constants/auth");
const { readBearerToken } = require("../utils/auth");

function createAuthController(authService) {
  return {
    async register(req, res) {
      try {
        const user = await authService.register(req.body);

        res.status(HTTP_STATUS.created).json(user);
      } catch (error) {
        res.status(HTTP_STATUS.badRequest).json({
          error: error.message
        });
      }
    },

    async login(req, res) {
      try {
        const session = await authService.login(req.body);

        res.status(HTTP_STATUS.ok).json(session);
      } catch (error) {
        res.status(HTTP_STATUS.unauthorized).json({
          error: error.message
        });
      }
    },

    async logout(req, res) {
      const token = readBearerToken(req);
      const session = await authService.resolveSession(token);

      if (!session.user) {
        return res.status(HTTP_STATUS.ok).json({
          success: true
        });
      }

      await authService.logout(session.user.id, token);

      return res.status(HTTP_STATUS.ok).json({
        success: true
      });
    },

    async session(req, res) {
      const token = readBearerToken(req);
      const session = await authService.resolveSession(token);

      return res.status(HTTP_STATUS.ok).json({
        clearToken: session.clearToken,
        isAuthenticated: Boolean(session.user),
        user: session.user
      });
    }
  };
}

module.exports = {
  createAuthController
};
