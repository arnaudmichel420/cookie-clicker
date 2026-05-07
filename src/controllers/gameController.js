const { HTTP_STATUS } = require("../constants/auth");
const { readAuthToken } = require("../utils/auth");
const { formatAmount } = require("../utils/cookieMath");

function formatGameStats(stats) {
  return {
    ...stats,
    formattedCookies: formatAmount(stats.cookies),
    formattedCookiesPerClick: formatAmount(stats.cookiesPerClick),
    formattedCookiesPerSecond: formatAmount(stats.cookiesPerSecond),
    upgrades: stats.upgrades.map((upgrade) => ({
      ...upgrade,
      formattedCurrentPrice: formatAmount(upgrade.currentPrice)
    }))
  };
}

function createGameController({ authService, gameService }) {
  async function resolveUser(req, res) {
    const token = readAuthToken(req);
    const session = await authService.resolveSession(token);

    if (!session.user) {
      res.status(HTTP_STATUS.unauthorized).json({
        error: "Utilisateur non connecté"
      });

      return null;
    }

    return session.user;
  }

  return {
    async page(req, res) {
      const token = readAuthToken(req);
      const session = await authService.resolveSession(token);

      if (!session.user) {
        return res.redirect("/login");
      }

      const stats = await gameService.getStats(session.user.id);

      return res.render("pages/game", {
        ...formatGameStats(stats),
        isAuthenticated: true,
        title: "Sovereign Clicker"
      });
    },

    async state(req, res) {
      const user = await resolveUser(req, res);

      if (!user) {
        return;
      }

      const stats = await gameService.getStats(user.id);

      res.status(HTTP_STATUS.ok).json(stats);
    },

    async click(req, res) {
      const user = await resolveUser(req, res);

      if (!user) {
        return;
      }

      try {
        const stats = await gameService.clickCookie(user.id);

        res.status(HTTP_STATUS.ok).json(stats);
      } catch (error) {
        res.status(HTTP_STATUS.badRequest).json({
          error: error.message
        });
      }
    },

    async purchaseUpgrade(req, res) {
      const user = await resolveUser(req, res);

      if (!user) {
        return;
      }

      try {
        const stats = await gameService.purchaseUpgrade(user.id, req.params.upgradeKey);

        res.status(HTTP_STATUS.ok).json(stats);
      } catch (error) {
        res.status(HTTP_STATUS.badRequest).json({
          error: error.message
        });
      }
    }
  };
}

module.exports = {
  createGameController
};
