const MAX_CLICKS_PER_SECOND = 10;

function createRateLimiter({ limit = MAX_CLICKS_PER_SECOND } = {}) {
  const clicksByUser = new Map();

  return {
    canClick(userId) {
      const now = Date.now();
      const currentSecond = Math.floor(now / 1000);
      const userClicks = clicksByUser.get(userId);

      if (!userClicks || userClicks.second !== currentSecond) {
        clicksByUser.set(userId, {
          second: currentSecond,
          count: 1
        });

        return true;
      }

      if (userClicks.count >= limit) {
        return false;
      }

      userClicks.count += 1;
      return true;
    }
  };
}

function assertAuthenticated(userId) {
  if (!userId) {
    throw new Error("Utilisateur non connecté");
  }
}

function normalizeStat(value) {
  if (!Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.min(Math.floor(value), Number.MAX_SAFE_INTEGER);
}

function normalizeSave(save) {
  return {
    cookies: normalizeStat(save?.cookies ?? 0),
    cookiesPerSecond: normalizeStat(save?.cookiesPerSecond ?? 0)
  };
}

function createGameService({ saveRepository, rateLimiter = createRateLimiter() } = {}) {
  if (!saveRepository) {
    throw new Error("Save repository requis");
  }

  return {
    async getStats(userId) {
      assertAuthenticated(userId);

      const save = await saveRepository.findByUserId(userId);

      return normalizeSave(save);
    },

    async clickCookie(userId) {
      assertAuthenticated(userId);

      if (!rateLimiter.canClick(userId)) {
        throw new Error("Limite de 10 clics par seconde dépassée");
      }

      const stats = await this.getStats(userId);
      const cookies = Math.min(stats.cookies + 1, Number.MAX_SAFE_INTEGER);
      const nextStats = {
        cookies,
        cookiesPerSecond: stats.cookiesPerSecond
      };

      try {
        await saveRepository.save(userId, nextStats);
      } catch (error) {
        throw new Error("Impossible de sauvegarder les statistiques", {
          cause: error
        });
      }

      return {
        ...nextStats,
        shouldAnimate: true
      };
    }
  };
}

module.exports = {
  createGameService,
  createRateLimiter
};
