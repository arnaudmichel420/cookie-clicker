function createInMemorySaveRepository(seedSaves = []) {
  const records = seedSaves.map((save) => ({ ...save }));

  return {
    async findByUserId(userId) {
      return records.find((save) => save.userId === userId) ?? null;
    },

    async save(userId, stats) {
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
    }
  };
}

module.exports = {
  createInMemorySaveRepository
};
