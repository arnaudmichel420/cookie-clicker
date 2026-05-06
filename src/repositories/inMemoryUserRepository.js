function createUserRepository(seedUsers = []) {
  const records = seedUsers.map((user, index) => ({
    id: user.id ?? index + 1,
    token: user.token ?? null,
    ...user
  }));

  return {
    async create(user) {
      const createdUser = {
        id: records.length + 1,
        token: null,
        ...user
      };

      records.push(createdUser);

      return createdUser;
    },
    async findByEmail(email) {
      return records.find((user) => user.email === email) ?? null;
    },
    async findByToken(token) {
      return records.find((user) => user.token === token) ?? null;
    },
    async removeToken(userId) {
      const user = records.find((record) => record.id === userId);

      if (user) {
        user.token = null;
      }
    },
    async saveToken(userId, token) {
      const user = records.find((record) => record.id === userId);

      if (user) {
        user.token = token;
      }
    }
  };
}

module.exports = {
  createUserRepository
};
