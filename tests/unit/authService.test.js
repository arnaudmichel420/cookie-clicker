function createAuthServiceForTest(options) {
  const { createAuthService } = require("../../src/services/authService");

  return createAuthService(options);
}

function decodeJwtPart(token, index) {
  return JSON.parse(Buffer.from(token.split(".")[index], "base64url").toString("utf8"));
}

function createJwtKeyPair() {
  const crypto = require("node:crypto");

  return crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem"
    },
    publicKeyEncoding: {
      type: "spki",
      format: "pem"
    }
  });
}

function createUserRepository(users = []) {
  const records = users.map((user) => ({ ...user }));

  return {
    create: vi.fn(async (user) => {
      const createdUser = {
        id: records.length + 1,
        token: null,
        ...user
      };

      records.push(createdUser);

      return createdUser;
    }),
    findByEmail: vi.fn(async (email) => {
      return records.find((user) => user.email === email) ?? null;
    }),
    findById: vi.fn(async (userId) => {
      return records.find((user) => user.id === userId) ?? null;
    }),
    findByToken: vi.fn(async (token) => {
      return records.find((user) => user.token === token) ?? null;
    }),
    removeToken: vi.fn(async (userId) => {
      const user = records.find((record) => record.id === userId);

      if (user) {
        user.token = null;
      }
    }),
    saveToken: vi.fn(async (userId, token) => {
      const user = records.find((record) => record.id === userId);

      if (user) {
        user.token = token;
      }
    }),
    getById(userId) {
      return records.find((user) => user.id === userId) ?? null;
    }
  };
}

function createValidUser(overrides = {}) {
  return {
    id: 1,
    email: "john@gmail.com",
    passwordHash: "hashed-password",
    token: null,
    ...overrides
  };
}

describe("authService - cas nominaux", () => {
  it("TU 1 - cree un compte avec une adresse email valide et un mot de passe valide", async () => {
    // Given : une adresse email valide et un mot de passe valide
    const userRepository = createUserRepository();
    const passwordService = {
      hash: vi.fn(async () => "hashed-password")
    };
    const authService = createAuthServiceForTest({ userRepository, passwordService });

    // When : l'utilisateur cree un compte
    const user = await authService.register({
      email: "john@gmail.com",
      password: "Password123!"
    });

    // Then : le compte est cree avec l'adresse email renseignee
    expect(user.email).toBe("john@gmail.com");
    expect(userRepository.create).toHaveBeenCalledWith({
      email: "john@gmail.com",
      passwordHash: "hashed-password"
    });
  });

  it("TU 2 - genere et associe un token quand l'utilisateur se connecte", async () => {
    // Given : un compte utilisateur existant avec une adresse email et un mot de passe valide
    const userRepository = createUserRepository([createValidUser()]);
    const passwordService = {
      verify: vi.fn(async () => true)
    };
    const tokenService = {
      generate: vi.fn(async () => "generated-token")
    };
    const authService = createAuthServiceForTest({
      userRepository,
      passwordService,
      tokenService
    });

    // When : l'utilisateur se connecte avec les bons identifiants
    const session = await authService.login({
      email: "john@gmail.com",
      password: "Password123!"
    });

    // Then : un token de connexion est genere sans stockage serveur obligatoire
    expect(session.token).toBe("generated-token");
    expect(tokenService.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        email: "john@gmail.com"
      })
    );
    expect(userRepository.saveToken).not.toHaveBeenCalled();
  });

  it("TU 3 - ne depend pas du stockage serveur quand l'utilisateur se deconnecte", async () => {
    // Given : un utilisateur connecte avec un JWT stateless
    const userRepository = createUserRepository([createValidUser({ token: "valid-token" })]);
    const authService = createAuthServiceForTest({ userRepository });

    // When : l'utilisateur se deconnecte
    await authService.logout(1);

    // Then : aucune suppression serveur n'est necessaire pour invalider une session stateless
    expect(userRepository.removeToken).not.toHaveBeenCalled();
    expect(userRepository.getById(1).token).toBe("valid-token");
  });

  it("TU 4 - conserve la session quand le token est valide", async () => {
    // Given : un utilisateur possede un token valide
    const userRepository = createUserRepository([createValidUser({ token: "valid-token" })]);
    const tokenService = {
      verify: vi.fn(async () => ({
        sub: "1",
        email: "john@gmail.com"
      }))
    };
    const authService = createAuthServiceForTest({ userRepository, tokenService });

    // When : l'application verifie sa session au chargement de la page
    const session = await authService.resolveSession("valid-token");

    // Then : l'utilisateur reste connecte
    expect(session.clearToken).toBe(false);
    expect(session.user.email).toBe("john@gmail.com");
    expect(userRepository.findById).toHaveBeenCalledWith(1);
  });

  it("TU 5 - invite a se connecter quand aucun token n'est fourni", async () => {
    // Given : un utilisateur arrive sur le site sans token
    const authService = createAuthServiceForTest();

    // When : l'application verifie sa session
    const session = await authService.resolveSession(null);

    // Then : l'utilisateur est invite a se connecter
    expect(session).toEqual({
      clearToken: false,
      user: null
    });
  });
});

describe("tokenService JWT - cas nominaux", () => {
  it("TU 15 - genere un JWT RS256 avec une expiration a 1 jour", async () => {
    // Given : un service de token JWT avec une date courante fixe
    const { createTokenService } = require("../../src/services/tokenService");
    const { privateKey, publicKey } = createJwtKeyPair();
    const tokenService = createTokenService({
      privateKey,
      publicKey,
      now: () => 1000
    });

    // When : un token est genere pour l'utilisateur
    const token = await tokenService.generate({
      id: 42,
      email: "jwt@gmail.com"
    });
    const header = decodeJwtPart(token, 0);
    const payload = decodeJwtPart(token, 1);

    // Then : le token est un JWT signe en RS256 et expire apres 24 heures
    expect(token.split(".")).toHaveLength(3);
    expect(header).toEqual({
      alg: "RS256",
      typ: "JWT"
    });
    expect(payload).toMatchObject({
      sub: "42",
      email: "jwt@gmail.com",
      iss: "cookie-clicker",
      iat: 1000,
      exp: 87400
    });
    await expect(tokenService.verify(token)).resolves.toMatchObject({
      sub: "42",
      email: "jwt@gmail.com",
      exp: 87400
    });
  });

  it("TU 16 - signe un JWT avec une cle privee protegee par passphrase", async () => {
    // Given : une paire de cles RSA dont la cle privee est chiffree
    const crypto = require("node:crypto");
    const { createTokenService } = require("../../src/services/tokenService");
    const passphrase = "test-passphrase";
    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
        cipher: "aes-256-cbc",
        passphrase
      },
      publicKeyEncoding: {
        type: "spki",
        format: "pem"
      }
    });
    const tokenService = createTokenService({
      privateKey,
      privateKeyPassphrase: passphrase,
      publicKey,
      now: () => 1000
    });

    // When : un JWT est genere avec la passphrase
    const token = await tokenService.generate({
      id: 24,
      email: "passphrase@gmail.com"
    });

    // Then : le token est valide avec la cle publique correspondante
    await expect(tokenService.verify(token)).resolves.toMatchObject({
      sub: "24",
      email: "passphrase@gmail.com"
    });
  });
});

describe("tokenService JWT - cas d'erreur", () => {
  it("TU 17 - refuse un JWT expire", async () => {
    // Given : un JWT cree avant sa date d'expiration
    const { createTokenService } = require("../../src/services/tokenService");
    const { privateKey, publicKey } = createJwtKeyPair();
    let currentTimestamp = 1000;
    const tokenService = createTokenService({
      privateKey,
      publicKey,
      now: () => currentTimestamp
    });
    const token = await tokenService.generate({
      id: 42,
      email: "expired@gmail.com"
    });

    // When : l'application verifie le token apres plus d'un jour
    currentTimestamp = 87401;

    // Then : le token est refuse
    await expect(tokenService.verify(token)).resolves.toBeNull();
  });

  it("TU 18 - refuse un JWT modifie", async () => {
    // Given : un JWT dont le payload est modifie sans nouvelle signature
    const { createTokenService } = require("../../src/services/tokenService");
    const { privateKey, publicKey } = createJwtKeyPair();
    const tokenService = createTokenService({
      privateKey,
      publicKey,
      now: () => 1000
    });
    const token = await tokenService.generate({
      id: 42,
      email: "jwt@gmail.com"
    });
    const parts = token.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        ...decodeJwtPart(token, 1),
        email: "attacker@gmail.com"
      })
    ).toString("base64url");
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    // When : l'application verifie le token
    // Then : la signature ne correspond plus
    await expect(tokenService.verify(tamperedToken)).resolves.toBeNull();
  });
});

describe("authService - cas d'erreur", () => {
  it("TU 6 - refuse de recreer un compte avec une adresse email deja utilisee", async () => {
    // Given : un compte existe deja avec l'adresse email john@gmail.com
    const userRepository = createUserRepository([createValidUser()]);
    const authService = createAuthServiceForTest({ userRepository });

    // When : un utilisateur tente de creer un nouveau compte avec l'adresse email john@gmail.com
    // Then : une erreur est envoyee a l'utilisateur
    await expect(
      authService.register({
        email: "john@gmail.com",
        password: "Password123!"
      })
    ).rejects.toThrow("Adresse email déjà utilisé");

    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it("TU 7 - renvoie une erreur quand l'adresse email de connexion est invalide", async () => {
    // Given : aucun compte n'existe avec l'adresse email renseignee
    const userRepository = createUserRepository();
    const passwordService = {
      verify: vi.fn()
    };
    const authService = createAuthServiceForTest({ userRepository, passwordService });

    // When : l'utilisateur tente de se connecter avec cette adresse email
    // Then : une erreur est envoyee a l'utilisateur
    await expect(
      authService.login({
        email: "john@gmail.com",
        password: "Password123!"
      })
    ).rejects.toThrow("Adresse email invalide");

    expect(passwordService.verify).not.toHaveBeenCalled();
  });

  it("TU 8 - renvoie une erreur quand le mot de passe est invalide", async () => {
    // Given : un compte existe avec une adresse email valide
    const userRepository = createUserRepository([createValidUser()]);
    const passwordService = {
      verify: vi.fn(async () => false)
    };
    const authService = createAuthServiceForTest({ userRepository, passwordService });

    // When : l'utilisateur tente de se connecter avec un mauvais mot de passe
    // Then : une erreur est envoyee a l'utilisateur
    await expect(
      authService.login({
        email: "john@gmail.com",
        password: "wrong-password"
      })
    ).rejects.toThrow("Mot de passe invalide");

    expect(passwordService.verify).toHaveBeenCalledWith("wrong-password", "hashed-password");
  });

  it("TU 9 - retire un token invalide ou expire", async () => {
    // Given : un utilisateur arrive sur le site avec un token invalide ou expire
    const tokenService = {
      verify: vi.fn(async () => null)
    };
    const authService = createAuthServiceForTest({ tokenService });

    // When : l'application verifie sa session
    const session = await authService.resolveSession("expired-token");

    // Then : le token est retire et l'utilisateur est invite a se reconnecter
    expect(session).toEqual({
      clearToken: true,
      user: null
    });
    expect(tokenService.verify).toHaveBeenCalledWith("expired-token");
  });
});

describe("authService - cas marginaux", () => {
  it("TU 10 - refuse la creation de compte avec un email vide", async () => {
    // Given : un utilisateur renseigne une adresse email vide
    const userRepository = createUserRepository();
    const authService = createAuthServiceForTest({ userRepository });

    // When : il tente de creer un compte
    // Then : une erreur de validation est envoyee a l'utilisateur
    await expect(
      authService.register({
        email: "",
        password: "Password123!"
      })
    ).rejects.toThrow("Adresse email obligatoire");

    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it("TU 11 - refuse la creation de compte avec un mot de passe vide", async () => {
    // Given : un utilisateur renseigne un mot de passe vide
    const userRepository = createUserRepository();
    const authService = createAuthServiceForTest({ userRepository });

    // When : il tente de creer un compte
    // Then : une erreur de validation est envoyee a l'utilisateur
    await expect(
      authService.register({
        email: "john@gmail.com",
        password: ""
      })
    ).rejects.toThrow("Mot de passe obligatoire");

    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it("TU 12 - nettoie les espaces autour de l'email avant verification", async () => {
    // Given : un utilisateur renseigne une adresse email avec des espaces avant ou apres
    const userRepository = createUserRepository();
    const passwordService = {
      hash: vi.fn(async () => "hashed-password")
    };
    const authService = createAuthServiceForTest({ userRepository, passwordService });

    // When : il cree un compte
    await authService.register({
      email: "  john@gmail.com  ",
      password: "Password123!"
    });

    // Then : l'adresse email est nettoyee avant verification
    expect(userRepository.findByEmail).toHaveBeenCalledWith("john@gmail.com");
    expect(userRepository.create).toHaveBeenCalledWith({
      email: "john@gmail.com",
      passwordHash: "hashed-password"
    });
  });

  it("TU 13 - ne declenche pas d'erreur au deuxieme clic sur deconnexion", async () => {
    // Given : un utilisateur vient de se deconnecter
    const userRepository = createUserRepository([createValidUser({ token: null })]);
    const authService = createAuthServiceForTest({ userRepository });

    // When : il clique une deuxieme fois sur se deconnecter
    await expect(authService.logout(1)).resolves.toBeUndefined();

    // Then : aucune erreur technique n'est declenchee et l'utilisateur reste deconnecte
    expect(userRepository.getById(1).token).toBeNull();
  });

  it("TU 14 - invite a se connecter au refresh quand le token est absent", async () => {
    // Given : un utilisateur rafraichit la page sans token stocke
    const authService = createAuthServiceForTest();

    // When : l'application verifie sa session
    const session = await authService.resolveSession(undefined);

    // Then : l'utilisateur est redirige ou invite a se connecter
    expect(session).toEqual({
      clearToken: false,
      user: null
    });
  });
});
