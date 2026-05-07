const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const AUTH_CLIENT_SCRIPT_PATH = path.join(process.cwd(), "src/public/scripts/auth-client.js");
const GAME_EFFECTS_SCRIPT_PATH = path.join(process.cwd(), "src/public/scripts/game-effects.js");
const SOUND_EFFECTS_SCRIPT_PATH = path.join(process.cwd(), "src/public/scripts/sound-effects.js");

function runBrowserScript(scriptPath, context) {
  const script = fs.readFileSync(scriptPath, "utf8");

  vm.runInNewContext(script, context);

  return context.window;
}

function createElementMock(tagName) {
  return {
    alt: "",
    className: "",
    draggable: true,
    src: "",
    style: {
      setProperty: vi.fn()
    },
    tagName,
    remove: vi.fn()
  };
}

describe("miscs - formatage des montants", () => {
  it("TU Miscs 1 - formate les milliers, millions, milliards et trillions", () => {
    // Given : des montants bruts à afficher dans l'interface
    const { formatAmount } = require("../../src/utils/cookieMath");

    // When : le formatter est appelé
    // Then : les montants sont convertis avec l'unité attendue
    expect(typeof formatAmount).toBe("function");
    expect(formatAmount(999)).toBe("999");
    expect(formatAmount(1500)).toBe("1.5K");
    expect(formatAmount(1200000)).toBe("1.2M");
    expect(formatAmount(2500000000)).toBe("2.5Md");
    expect(formatAmount(7000000000000)).toBe("7T");
  });

  it("TU Miscs 2 - conserve un format lisible pour les valeurs invalides ou limites", () => {
    // Given : des montants négatifs, nuls ou invalides
    const { formatAmount } = require("../../src/utils/cookieMath");

    // When : le formatter est appelé
    // Then : l'affichage reste stable
    expect(typeof formatAmount).toBe("function");
    expect(formatAmount(0)).toBe("0");
    expect(formatAmount(-15)).toBe("0");
    expect(formatAmount(Number.NaN)).toBe("0");
  });
});

describe("miscs - log-out", () => {
  it("TU Miscs 3 - supprime le token local et le cookie lors du log-out", async () => {
    // Given : un utilisateur possède une session locale
    let cookieValue = "auth_token=token-123";
    const storage = new Map([["auth_token", "token-123"]]);
    const fetchMock = vi.fn(async () => ({
      json: async () => ({
        isAuthenticated: false
      })
    }));
    const windowObject = {
      fetch: fetchMock,
      localStorage: {
        getItem: vi.fn((key) => storage.get(key) ?? null),
        removeItem: vi.fn((key) => storage.delete(key)),
        setItem: vi.fn((key, value) => storage.set(key, value))
      },
      document: {}
    };

    Object.defineProperty(windowObject.document, "cookie", {
      get: () => cookieValue,
      set: (value) => {
        cookieValue = value;
      }
    });

    runBrowserScript(AUTH_CLIENT_SCRIPT_PATH, {
      document: windowObject.document,
      fetch: fetchMock,
      localStorage: windowObject.localStorage,
      window: windowObject
    });

    // When : le log-out est demandé
    await windowObject.authClient.logout();

    // Then : la session est supprimée côté client
    expect(fetchMock).toHaveBeenCalledWith("/logout", {
      method: "POST",
      headers: {
        Authorization: "Bearer token-123"
      }
    });
    expect(windowObject.localStorage.removeItem).toHaveBeenCalledWith("auth_token");
    expect(cookieValue).toContain("auth_token=");
    expect(cookieValue).toContain("max-age=0");
  });
});

describe("miscs - raccourcis d'upgrades", () => {
  it("TU Miscs 4 - relie chaque raccourci a une categorie d'upgrade connue", () => {
    // Given : le script de la page de jeu
    const script = fs.readFileSync(
      path.join(process.cwd(), "src/public/scripts/game-page.js"),
      "utf8"
    );

    // When : les raccourcis sont branchés
    // Then : le filtre sélectionné ouvre uniquement les cartes de la catégorie ciblée
    expect(script).toContain("shopFilters");
    expect(script).toContain("data-upgrade-filter");
    expect(script).toContain("applyUpgradeFilter(filterButton.dataset.upgradeFilter)");
    expect(script).toContain("resolvedFilter === null || card.dataset.upgradeFilterKind === resolvedFilter");
    expect(script).toContain("card.hidden = !shouldShow");
    expect(script).toContain("setShopCollapsed(false)");
  });
});

describe("miscs - sons pendant les animations", () => {
  it("TU Miscs 5 - expose des sons distincts pour l'avion de chasse et les missiles", () => {
    // Given : une configuration sonore avec des sons d'animation
    const windowObject = {
      SOUND_EFFECTS: {
        animation: {
          fighter: "/sounds/effects/fighter.mp3",
          missile: "/sounds/effects/missile.mp3"
        },
        background: null,
        click: [],
        upgrade: []
      }
    };

    runBrowserScript(SOUND_EFFECTS_SCRIPT_PATH, {
      Promise,
      window: windowObject
    });

    // When : le module de sons est créé
    const soundEffects = windowObject.createGameSoundEffects({
      Audio: vi.fn(),
      soundEffects: windowObject.SOUND_EFFECTS
    });

    // Then : les sons d'animations sont accessibles séparément
    expect(Object.keys(soundEffects)).toEqual([
      "playClickSound",
      "playUpgradeSound",
      "startBackgroundMusic",
      "playFighterSound",
      "playMissileSound"
    ]);
  });

  it("TU Miscs 6 - joue le bon son quand une animation avion ou missile demarre", () => {
    // Given : des effets de jeu avec un contrôleur sonore
    const appendedElements = [];
    const sounds = {
      playFighterSound: vi.fn(),
      playMissileSound: vi.fn()
    };
    let now = 10000;
    const layer = {
      append: vi.fn((element) => appendedElements.push(element))
    };
    const characterLayer = {
      append: vi.fn()
    };
    const documentMock = {
      createElement: vi.fn(createElementMock)
    };
    const windowObject = {
      clearInterval: vi.fn(),
      setInterval: vi.fn(),
      setTimeout: vi.fn()
    };

    runBrowserScript(GAME_EFFECTS_SCRIPT_PATH, {
      Date: {
        now: () => now
      },
      Math,
      document: documentMock,
      window: windowObject
    });

    const gameEffects = windowObject.createGameEffects({
      characterLayer,
      layer,
      sounds
    });

    // When : les seuils de spam déclenchent les missiles puis l'avion
    for (let index = 0; index < 12; index += 1) {
      gameEffects.triggerClickEffects();
      now += 100;
    }

    for (let index = 0; index < 3; index += 1) {
      gameEffects.triggerClickEffects();
      now += 100;
    }

    // Then : chaque animation lance son son associé
    expect(appendedElements.some((element) => element.className === "effect-missile")).toBe(true);
    expect(appendedElements.some((element) => element.className === "effect-fighter")).toBe(true);
    expect(sounds.playMissileSound).toHaveBeenCalledTimes(1);
    expect(sounds.playFighterSound).toHaveBeenCalledTimes(1);
  });
});
