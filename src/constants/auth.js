const AUTH_ERRORS = {
  duplicateEmail: "Adresse email déjà utilisé",
  invalidEmail: "Adresse email invalide",
  missingEmail: "Adresse email obligatoire",
  missingPassword: "Mot de passe obligatoire",
  invalidPassword: "Mot de passe invalide"
};

const AUTH_TOKEN = {
  byteLength: 24,
  prefix: "Bearer "
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
