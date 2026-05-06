const {
  DEFAULT_CLICK_MULTIPLIER,
  MAX_CLICKS_PER_SECOND,
  MAX_PRICE,
  UPGRADE_DEFINITIONS,
  getUpgradeByKey
} = require("../constants/game");

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

function normalizeStat(value, fallback = 0) {
  if (!Number.isFinite(value) || value < 0) {
    return fallback;
  }

  return Math.min(Math.floor(value), Number.MAX_SAFE_INTEGER);
}

function createDefaultUpgradeLevels() {
  return UPGRADE_DEFINITIONS.reduce((levels, upgrade) => {
    levels[upgrade.key] = 0;
    return levels;
  }, {});
}

function normalizeUpgradeLevels(upgradeLevels) {
  const baseLevels = createDefaultUpgradeLevels();

  for (const [upgradeKey, level] of Object.entries(upgradeLevels ?? {})) {
    if (Object.hasOwn(baseLevels, upgradeKey)) {
      baseLevels[upgradeKey] = normalizeStat(level, 0);
    }
  }

  return baseLevels;
}

function normalizeTimestamp(value) {
  if (!value) {
    return Date.now();
  }

  const parsed = new Date(value).getTime();

  return Number.isFinite(parsed) ? parsed : Date.now();
}

function calculateCookiesPerSecond(upgradeLevels) {
  return UPGRADE_DEFINITIONS.reduce((total, upgrade) => {
    if (upgrade.kind !== "auto") {
      return total;
    }

    return total + upgrade.effectValue * upgradeLevels[upgrade.key];
  }, 0);
}

function calculateClickMultiplier(upgradeLevels) {
  return UPGRADE_DEFINITIONS.reduce((total, upgrade) => {
    if (upgrade.kind !== "click") {
      return total;
    }

    return total + upgrade.effectValue * upgradeLevels[upgrade.key];
  }, DEFAULT_CLICK_MULTIPLIER);
}

function calculateUpgradeCount(upgradeLevels) {
  return Object.values(upgradeLevels).reduce((total, level) => total + level, 0);
}

function calculateUpgradePrice(upgrade, ownedCount) {
  const scaledPrice = Math.floor(upgrade.basePrice * upgrade.priceMultiplier ** ownedCount);

  return Math.min(Math.max(scaledPrice, upgrade.basePrice), MAX_PRICE);
}

function buildUpgradeState(upgradeLevels) {
  return UPGRADE_DEFINITIONS.map((upgrade) => {
    const owned = upgradeLevels[upgrade.key];

    return {
      ...upgrade,
      currentPrice: calculateUpgradePrice(upgrade, owned),
      owned
    };
  });
}

function normalizeSave(save) {
  const upgradeLevels = normalizeUpgradeLevels(save?.upgradeLevels);
  const cookiesPerSecond = calculateCookiesPerSecond(upgradeLevels);
  const cookiesPerClick = calculateClickMultiplier(upgradeLevels);

  return {
    cookies: normalizeStat(save?.cookies ?? 0),
    cookiesPerSecond,
    cookiesPerClick,
    lastCollectedAt: normalizeTimestamp(save?.lastCollectedAt),
    upgradeLevels,
    upgradeCount: calculateUpgradeCount(upgradeLevels),
    upgrades: buildUpgradeState(upgradeLevels)
  };
}

function buildPersistedState(stats) {
  return {
    cookies: stats.cookies,
    cookiesPerSecond: stats.cookiesPerSecond,
    cookiesPerClick: stats.cookiesPerClick,
    lastCollectedAt: new Date(stats.lastCollectedAt).toISOString(),
    upgradeLevels: stats.upgradeLevels
  };
}

function buildClickEffect(stats) {
  return {
    kind: "trump-click",
    visual: true,
    sound: {
      key: "trump-click",
      stackable: true
    },
    intensity: stats.cookiesPerClick
  };
}

function buildPurchaseEffect(upgrade, nextOwnedCount) {
  return {
    kind: "upgrade-purchase",
    visual: true,
    sound: {
      key: "upgrade-purchase",
      stackable: false
    },
    intensity: upgrade.effectValue * nextOwnedCount,
    upgradeKey: upgrade.key,
    basePrice: upgrade.basePrice,
    ownedCount: nextOwnedCount
  };
}

function createGameService({ saveRepository, rateLimiter = createRateLimiter() } = {}) {
  if (!saveRepository) {
    throw new Error("Save repository requis");
  }

  async function persistStats(userId, stats) {
    try {
      const savedStats = await saveRepository.save(userId, buildPersistedState(stats));

      return normalizeSave(savedStats);
    } catch (error) {
      throw new Error("Impossible de sauvegarder les statistiques", {
        cause: error
      });
    }
  }

  async function loadCurrentStats(userId) {
    const save = await saveRepository.findByUserId(userId);
    const stats = normalizeSave(save);
    const now = Date.now();

    if (stats.cookiesPerSecond <= 0) {
      return stats;
    }

    const elapsedSeconds = Math.max(0, Math.floor((now - stats.lastCollectedAt) / 1000));

    if (elapsedSeconds === 0) {
      return stats;
    }

    const nextStats = {
      ...stats,
      cookies: Math.min(
        stats.cookies + elapsedSeconds * stats.cookiesPerSecond,
        Number.MAX_SAFE_INTEGER
      ),
      lastCollectedAt: stats.lastCollectedAt + elapsedSeconds * 1000
    };

    return persistStats(userId, nextStats);
  }

  return {
    async getStats(userId) {
      assertAuthenticated(userId);

      return loadCurrentStats(userId);
    },

    async clickCookie(userId) {
      assertAuthenticated(userId);

      if (!rateLimiter.canClick(userId)) {
        throw new Error("Limite de 20 clics par seconde dépassée");
      }

      const stats = await loadCurrentStats(userId);
      const nextStats = {
        ...stats,
        cookies: Math.min(stats.cookies + stats.cookiesPerClick, Number.MAX_SAFE_INTEGER),
        lastCollectedAt: Date.now()
      };
      const savedStats = await persistStats(userId, nextStats);

      return {
        ...savedStats,
        clickEffect: buildClickEffect(savedStats),
        shouldAnimate: true
      };
    },

    async purchaseUpgrade(userId, upgradeKey) {
      assertAuthenticated(userId);

      const upgrade = getUpgradeByKey(upgradeKey);

      if (!upgrade) {
        throw new Error("Upgrade introuvable");
      }

      const stats = await loadCurrentStats(userId);
      const currentPrice = calculateUpgradePrice(upgrade, stats.upgradeLevels[upgradeKey]);

      if (stats.cookies < currentPrice) {
        throw new Error("Fonds insuffisants");
      }

      const nextUpgradeLevels = {
        ...stats.upgradeLevels,
        [upgradeKey]: stats.upgradeLevels[upgradeKey] + 1
      };
      const nextStats = normalizeSave({
        ...stats,
        cookies: stats.cookies - currentPrice,
        upgradeLevels: nextUpgradeLevels,
        lastCollectedAt: new Date().toISOString()
      });

      const savedStats = await persistStats(userId, nextStats);

      return {
        ...savedStats,
        purchaseEffect: buildPurchaseEffect(upgrade, nextUpgradeLevels[upgradeKey])
      };
    }
  };
}

module.exports = {
  createGameService,
  createRateLimiter
};
