function createGameServiceForTest(options) {
  const { createGameService } = require("../../src/services/gameService");

  return createGameService(options);
}

function createSaveRepository(saves = []) {
  const records = saves.map((save) => ({
    ...save,
    upgradeLevels: {
      pickup: 0,
      oil: 0,
      wallStreet: 0,
      gold: 0,
      diamond: 0,
      ...save.upgradeLevels
    }
  }));

  return {
    findByUserId: vi.fn(async (userId) => {
      return records.find((save) => save.userId === userId) ?? null;
    }),
    save: vi.fn(async (userId, stats) => {
      const existingSave = records.find((save) => save.userId === userId);

      if (existingSave) {
        Object.assign(existingSave, stats, {
          upgradeLevels: {
            ...existingSave.upgradeLevels,
            ...stats.upgradeLevels
          }
        });

        return existingSave;
      }

      const createdSave = {
        userId,
        ...stats,
        upgradeLevels: {
          pickup: 0,
          oil: 0,
          wallStreet: 0,
          gold: 0,
          diamond: 0,
          ...stats.upgradeLevels
        }
      };

      records.push(createdSave);

      return createdSave;
    }),
    getByUserId(userId) {
      return records.find((save) => save.userId === userId) ?? null;
    }
  };
}

function createStats(overrides = {}) {
  return {
    userId: 1,
    cookies: 10,
    cookiesPerSecond: 0,
    cookiesPerClick: 1,
    lastCollectedAt: "2026-05-06T10:00:00.000Z",
    upgradeLevels: {
      pickup: 0,
      oil: 0,
      wallStreet: 0,
      gold: 0,
      diamond: 0
    },
    ...overrides
  };
}

describe("gameService - cas nominaux", () => {
  it("TU 1 - retourne les statistiques du joueur connecte", async () => {
    const saveRepository = createSaveRepository([createStats({ cookies: 42 })]);
    const gameService = createGameServiceForTest({ saveRepository });

    const stats = await gameService.getStats(1);

    expect(stats).toMatchObject({
      cookies: 42,
      cookiesPerSecond: 0,
      cookiesPerClick: 1,
      upgradeCount: 0
    });
  });

  it("TU 2 - ajoute le gain par clic actuel quand l'utilisateur clique", async () => {
    const saveRepository = createSaveRepository([
      createStats({
        cookies: 0,
        upgradeLevels: {
          gold: 1
        }
      })
    ]);
    const gameService = createGameServiceForTest({ saveRepository });

    const stats = await gameService.clickCookie(1);

    expect(stats.cookies).toBe(2);
    expect(stats.cookiesPerClick).toBe(2);
  });

  it("TU 3 - achete un auto-clicker, soustrait son prix et augmente le gain passif", async () => {
    const saveRepository = createSaveRepository([createStats({ cookies: 25 })]);
    const gameService = createGameServiceForTest({ saveRepository });

    const stats = await gameService.purchaseUpgrade(1, "pickup");

    expect(stats.cookies).toBe(5);
    expect(stats.cookiesPerSecond).toBe(1);
    expect(stats.upgradeLevels.pickup).toBe(1);
  });

  it("TU 4 - achete un boost de clic et augmente le gain par clic", async () => {
    const saveRepository = createSaveRepository([createStats({ cookies: 80 })]);
    const gameService = createGameServiceForTest({ saveRepository });

    const stats = await gameService.purchaseUpgrade(1, "gold");

    expect(stats.cookies).toBe(50);
    expect(stats.cookiesPerClick).toBe(2);
    expect(stats.upgradeLevels.gold).toBe(1);
  });

  it("TU 5 - augmente le prix d'un upgrade apres chaque achat", async () => {
    const saveRepository = createSaveRepository([createStats({ cookies: 200 })]);
    const gameService = createGameServiceForTest({ saveRepository });

    const firstPurchase = await gameService.purchaseUpgrade(1, "pickup");
    const secondPickup = firstPurchase.upgrades.find((upgrade) => upgrade.key === "pickup");

    expect(secondPickup.currentPrice).toBeGreaterThan(20);
  });

  it("TU 6 - conserve les upgrades propres a chaque utilisateur", async () => {
    const saveRepository = createSaveRepository([
      createStats({ userId: 1, cookies: 50 }),
      createStats({ userId: 2, cookies: 50 })
    ]);
    const gameService = createGameServiceForTest({ saveRepository });

    await gameService.purchaseUpgrade(1, "pickup");

    expect(saveRepository.getByUserId(1).upgradeLevels.pickup).toBe(1);
    expect(saveRepository.getByUserId(2).upgradeLevels.pickup).toBe(0);
  });
});

describe("gameService - cas d'erreur", () => {
  it("TU 7 - refuse de charger les statistiques sans utilisateur connecte", async () => {
    const saveRepository = createSaveRepository();
    const gameService = createGameServiceForTest({ saveRepository });

    await expect(gameService.getStats(null)).rejects.toThrow("Utilisateur non connecté");
  });

  it("TU 8 - refuse un clic sans utilisateur connecte", async () => {
    const saveRepository = createSaveRepository();
    const gameService = createGameServiceForTest({ saveRepository });

    await expect(gameService.clickCookie(undefined)).rejects.toThrow("Utilisateur non connecté");
  });

  it("TU 9 - refuse l'achat d'un upgrade sans fonds suffisants", async () => {
    const saveRepository = createSaveRepository([createStats({ cookies: 10 })]);
    const gameService = createGameServiceForTest({ saveRepository });

    await expect(gameService.purchaseUpgrade(1, "pickup")).rejects.toThrow("Fonds insuffisants");

    expect(saveRepository.save).not.toHaveBeenCalled();
  });

  it("TU 10 - refuse les clics au dela de 20 clics par seconde", async () => {
    const saveRepository = createSaveRepository([createStats({ cookies: 10 })]);
    const rateLimiter = {
      canClick: vi.fn(() => false)
    };
    const gameService = createGameServiceForTest({ saveRepository, rateLimiter });

    await expect(gameService.clickCookie(1)).rejects.toThrow("Limite de 20 clics par seconde dépassée");
  });

  it("TU 11 - renvoie une erreur metier quand la sauvegarde echoue", async () => {
    const saveRepository = {
      findByUserId: vi.fn(async () => createStats({ cookies: 40 })),
      save: vi.fn(async () => {
        throw new Error("Erreur base de donnees");
      })
    };
    const gameService = createGameServiceForTest({ saveRepository });

    await expect(gameService.purchaseUpgrade(1, "gold")).rejects.toThrow(
      "Impossible de sauvegarder les statistiques"
    );
  });

  it("TU 12 - refuse l'achat d'une upgrade inconnue", async () => {
    const saveRepository = createSaveRepository([createStats({ cookies: 100 })]);
    const gameService = createGameServiceForTest({ saveRepository });

    await expect(gameService.purchaseUpgrade(1, "unknown-upgrade")).rejects.toThrow(
      "Upgrade introuvable"
    );

    expect(saveRepository.save).not.toHaveBeenCalled();
  });
});

describe("gameService - cas limites", () => {
  it("TU 13 - initialise les statistiques a 0 quand aucune sauvegarde n'existe", async () => {
    const saveRepository = createSaveRepository();
    const gameService = createGameServiceForTest({ saveRepository });

    const stats = await gameService.getStats(1);

    expect(stats).toMatchObject({
      cookies: 0,
      cookiesPerSecond: 0,
      cookiesPerClick: 1,
      upgradeCount: 0
    });
  });

  it("TU 14 - transforme une statistique negative en 0", async () => {
    const saveRepository = createSaveRepository([createStats({ cookies: -5 })]);
    const gameService = createGameServiceForTest({ saveRepository });

    const stats = await gameService.getStats(1);

    expect(stats.cookies).toBe(0);
  });

  it("TU 15 - borne le compteur au maximum securise", async () => {
    const saveRepository = createSaveRepository([
      createStats({
        cookies: Number.MAX_SAFE_INTEGER,
        upgradeLevels: {
          gold: 1
        }
      })
    ]);
    const gameService = createGameServiceForTest({ saveRepository });

    const stats = await gameService.clickCookie(1);

    expect(stats.cookies).toBe(Number.MAX_SAFE_INTEGER);
  });
});
