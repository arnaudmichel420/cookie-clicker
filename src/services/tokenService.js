const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { AUTH_TOKEN } = require("../constants/auth");

function base64UrlEncode(value) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlJson(value) {
  return base64UrlEncode(JSON.stringify(value));
}

function decodeBase64UrlJson(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function normalizePem(value) {
  return typeof value === "string" ? value.replaceAll("\\n", "\n") : value;
}

function readKeyFile(keyPath) {
  return fs.readFileSync(path.resolve(process.cwd(), keyPath), "utf8");
}

function resolveKey({ key, keyPath, label }) {
  const resolvedKey = key ? normalizePem(key) : readKeyFile(keyPath);

  if (!resolvedKey) {
    throw new Error(`${label} JWT manquante`);
  }

  return resolvedKey;
}

function createPrivateKeyConfig(privateKey, passphrase) {
  if (privateKey.includes("ENCRYPTED PRIVATE KEY") && !passphrase) {
    throw new Error("Passphrase JWT_PRIVATE_KEY_PASSPHRASE requise pour la cle privee chiffree");
  }

  if (!passphrase) {
    return privateKey;
  }

  return {
    key: privateKey,
    passphrase
  };
}

function createTokenService({
  privateKey = AUTH_TOKEN.privateKey,
  privateKeyPassphrase = AUTH_TOKEN.privateKeyPassphrase,
  privateKeyPath = AUTH_TOKEN.privateKeyPath,
  publicKey = AUTH_TOKEN.publicKey,
  publicKeyPath = AUTH_TOKEN.publicKeyPath,
  expiresInSeconds = AUTH_TOKEN.expiresInSeconds,
  issuer = AUTH_TOKEN.issuer,
  now = () => Math.floor(Date.now() / 1000)
} = {}) {
  return {
    async generate(user) {
      const issuedAt = now();
      const header = {
        alg: "RS256",
        typ: "JWT"
      };
      const payload = {
        sub: String(user.id),
        email: user.email,
        iss: issuer,
        iat: issuedAt,
        exp: issuedAt + expiresInSeconds
      };
      const unsignedToken = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
      const resolvedPrivateKey = resolveKey({
        key: privateKey,
        keyPath: privateKeyPath,
        label: "Cle privee"
      });
      const signature = crypto
        .createSign("RSA-SHA256")
        .update(unsignedToken)
        .end()
        .sign(createPrivateKeyConfig(resolvedPrivateKey, privateKeyPassphrase), "base64url");

      return `${unsignedToken}.${signature}`;
    },
    async verify(token) {
      if (!token) {
        return null;
      }

      const parts = token.split(".");

      if (parts.length !== 3) {
        return null;
      }

      const [encodedHeader, encodedPayload, signature] = parts;
      const unsignedToken = `${encodedHeader}.${encodedPayload}`;

      try {
        const resolvedPublicKey = resolveKey({
          key: publicKey,
          keyPath: publicKeyPath,
          label: "Cle publique"
        });
        const header = decodeBase64UrlJson(encodedHeader);
        const payload = decodeBase64UrlJson(encodedPayload);
        const isSignatureValid = crypto
          .createVerify("RSA-SHA256")
          .update(unsignedToken)
          .end()
          .verify(resolvedPublicKey, signature, "base64url");

        if (!isSignatureValid || header.alg !== "RS256" || header.typ !== "JWT") {
          return null;
        }

        if (payload.iss !== issuer || payload.exp <= now()) {
          return null;
        }

        return payload;
      } catch {
        return null;
      }
    },
    async revoke() {
      return undefined;
    }
  };
}

module.exports = {
  createTokenService
};
