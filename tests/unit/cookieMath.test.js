const { incrementCookies } = require("../../src/utils/cookieMath");

describe("incrementCookies", () => {
  it("adds the cookies earned by a click", () => {
    expect(incrementCookies(10, 2)).toBe(12);
  });
});
