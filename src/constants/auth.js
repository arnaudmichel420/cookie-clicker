const AUTH_ERRORS = {
  duplicateEmail: "Adresse email déjà utilisé",
  invalidEmail: "Adresse email invalide",
  missingEmail: "Adresse email obligatoire",
  missingPassword: "Mot de passe obligatoire",
  invalidPassword: "Mot de passe invalide"
};

const AUTH_TOKEN = {
  expiresInSeconds: 24 * 60 * 60,
  issuer: "cookie-clicker",
  prefix: "Bearer ",
  privateKey: process.env.JWT_PRIVATE_KEY || "",
  privateKeyPassphrase: process.env.JWT_PRIVATE_KEY_PASSPHRASE || "",
  privateKeyPath: process.env.JWT_PRIVATE_KEY_PATH || "./jwt-private.pem",
  publicKey: process.env.JWT_PUBLIC_KEY || "",
  publicKeyPath: process.env.JWT_PUBLIC_KEY_PATH || "./jwt-public.pem"
};

const HTTP_STATUS = {
  created: 201,
  ok: 200,
  badRequest: 400,
  unauthorized: 401
};

module.exports = {
  AUTH_ERRORS,
  AUTH_TOKEN,
  HTTP_STATUS
};
