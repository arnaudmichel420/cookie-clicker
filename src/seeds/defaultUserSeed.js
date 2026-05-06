const dotenv = require("dotenv");
const { getDbPath } = require("../config/appConfig");
const {
  DEFAULT_USER,
  createSqliteUserRepository
} = require("../repositories/sqliteUserRepository");

dotenv.config();

async function seedDefaultUser() {
  const repository = createSqliteUserRepository(getDbPath());

  try {
    const result = await repository.seedDefaultUser();
    const action = result.created ? "créé" : "déjà présent";

    console.log(`Utilisateur par défaut ${action}: ${DEFAULT_USER.email}`);
  } finally {
    repository.close();
  }
}

seedDefaultUser().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
