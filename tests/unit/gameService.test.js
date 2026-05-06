function createGameServiceForTest(options) {
  const { createGameService } = require("../../src/services/gameService");

  return createGameService(options);
}

function createSaveRepository(saves = []) {
  const records = saves.map((save) => ({ ...save }));

  return {
    findByUserId: vi.fn(async (userId) => {
      return records.find((save) => save.userId === userId) ?? null;
    }),
    save: vi.fn(async (userId, stats) => {
      const existingSave = records.find((save) => save.userId === userId);

      if (existingSave) {
        Object.assign(existingSave, stats);
        return existingSave;
      }

      const createdSave = {
        userId,
        ...stats
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
    ...overrides
  };
}

describe("gameService - cas nominaux", () => {
  it("TU 1 - retourne les statistiques du joueur connecte", async () => {
    // Given : un utilisateur connecte possede des statistiques en base
    const saveRepository = createSaveRepository([createStats({ cookies: 42, cookiesPerSecond: 2 })]);
    const gameService = createGameServiceForTest({ saveRepository });

    // When : l'application charge la page du jeu
    const stats = await gameService.getStats(1);

    // Then : le nombre de cookies et les cookies par seconde sont retournes
    expect(stats).toEqual({
      cookies: 42,
      cookiesPerSecond: 2
    });
  });

  it("TU 2 - ajoute 1 cookie quand l'utilisateur clique sur le cookie", async () => {
    // Given : un utilisateur connecte possede 0 cookie
    const saveRepository = createSaveRepository([createStats({ cookies: 0 })]);
    const gameService = createGameServiceForTest({ saveRepository });

    // When : il clique sur le cookie
    const stats = await gameService.clickCookie(1);

    // Then : son compteur affiche 1 cookie
    expect(stats.cookies).toBe(1);
    expect(saveRepository.save).toHaveBeenCalledWith(1, {
      cookies: 1,
      cookiesPerSecond: 0
    });
  });

  it("TU 3 - persiste le compteur apres chaque clic", async () => {
    // Given : un utilisateur connecte possede deja 2 cookies
    const saveRepository = createSaveRepository([createStats({ cookies: 2 })]);
    const gameService = createGameServiceForTest({ saveRepository });

    // When : il clique sur le cookie
    await gameService.clickCookie(1);

    // Then : les nouvelles statistiques sont sauvegardees
    expect(saveRepository.getByUserId(1)).toMatchObject({
      cookies: 3,
      cookiesPerSecond: 0
    });
  });

  it("TU 4 - demande l'animation du personnage apres un clic", async () => {
    // Given : un utilisateur connecte est sur la page du jeu
    const saveRepository = createSaveRepository([createStats({ cookies: 0 })]);
    const gameService = createGameServiceForTest({ saveRepository });

    // When : il clique sur le cookie
    const stats = await gameService.clickCookie(1);

    // Then : le retour indique que l'animation de clic doit etre jouee
    expect(stats.shouldAnimate).toBe(true);
  });
});

describe("gameService - cas d'erreur", () => {
  it("TU 5 - refuse de charger les statistiques sans utilisateur connecte", async () => {
    // Given : aucun utilisateur n'est connecte
    const saveRepository = createSaveRepository();
    const gameService = createGameServiceForTest({ saveRepository });

    // When : l'application tente de charger les statistiques
    // Then : une erreur est envoyee
    await expect(gameService.getStats(null)).rejects.toThrow("Utilisateur non connecté");

    expect(saveRepository.findByUserId).not.toHaveBeenCalled();
  });

  it("TU 6 - refuse un clic sans utilisateur connecte", async () => {
    // Given : aucun utilisateur n'est connecte
    const saveRepository = createSaveRepository();
    const gameService = createGameServiceForTest({ saveRepository });

    // When : l'utilisateur tente de cliquer sur le cookie
    // Then : une erreur est envoyee
    await expect(gameService.clickCookie(undefined)).rejects.toThrow("Utilisateur non connecté");

    expect(saveRepository.save).not.toHaveBeenCalled();
  });

  it("TU 7 - renvoie une erreur quand la sauvegarde du clic echoue", async () => {
    // Given : la base de donnees ne peut pas sauvegarder les statistiques
    const saveRepository = {
      findByUserId: vi.fn(async () => createStats({ cookies: 4 })),
      save: vi.fn(async () => {
        throw new Error("Erreur base de donnees");
      })
    };
    const gameService = createGameServiceForTest({ saveRepository });

    // When : l'utilisateur clique sur le cookie
    // Then : une erreur metier est envoyee
    await expect(gameService.clickCookie(1)).rejects.toThrow("Impossible de sauvegarder les statistiques");
  });
});

describe("gameService - cas limites", () => {
  it("TU 8 - initialise les statistiques a 0 quand aucune sauvegarde n'existe", async () => {
    // Given : un utilisateur connecte n'a aucune sauvegarde
    const saveRepository = createSaveRepository();
    const gameService = createGameServiceForTest({ saveRepository });

    // When : l'application charge ses statistiques
    const stats = await gameService.getStats(1);

    // Then : les statistiques commencent a 0
    expect(stats).toEqual({
      cookies: 0,
      cookiesPerSecond: 0
    });
  });

  it("TU 9 - transforme une statistique negative en 0", async () => {
    // Given : une sauvegarde contient un compteur negatif invalide
    const saveRepository = createSaveRepository([createStats({ cookies: -5, cookiesPerSecond: -1 })]);
    const gameService = createGameServiceForTest({ saveRepository });

    // When : l'application charge les statistiques
    const stats = await gameService.getStats(1);

    // Then : les statistiques affichees restent positives
    expect(stats).toEqual({
      cookies: 0,
      cookiesPerSecond: 0
    });
  });

  it("TU 10 - ne depasse pas le nombre entier maximum securise", async () => {
    // Given : un utilisateur possede deja le maximum de cookies autorise
    const saveRepository = createSaveRepository([createStats({ cookies: Number.MAX_SAFE_INTEGER })]);
    const gameService = createGameServiceForTest({ saveRepository });

    // When : il clique sur le cookie
    const stats = await gameService.clickCookie(1);

    // Then : le compteur reste borne au maximum securise
    expect(stats.cookies).toBe(Number.MAX_SAFE_INTEGER);
    expect(saveRepository.save).toHaveBeenCalledWith(1, {
      cookies: Number.MAX_SAFE_INTEGER,
      cookiesPerSecond: 0
    });
  });

  it("TU 11 - refuse les clics au dela de 10 clics par seconde", async () => {
    // Given : un utilisateur a deja clique 10 fois pendant la meme seconde
    const saveRepository = createSaveRepository([createStats({ cookies: 10 })]);
    const rateLimiter = {
      canClick: vi.fn(() => false)
    };
    const gameService = createGameServiceForTest({ saveRepository, rateLimiter });

    // When : il tente de cliquer une onzieme fois pendant cette seconde
    // Then : le clic est refuse et les statistiques ne sont pas sauvegardees
    await expect(gameService.clickCookie(1)).rejects.toThrow("Limite de 10 clics par seconde dépassée");

    expect(rateLimiter.canClick).toHaveBeenCalledWith(1);
    expect(saveRepository.save).not.toHaveBeenCalled();
  });
});
