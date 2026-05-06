const MAX_CLICKS_PER_SECOND = 10;
const MAX_PRICE = Number.MAX_SAFE_INTEGER;
const DEFAULT_CLICK_MULTIPLIER = 1;

const UPGRADE_DEFINITIONS = Object.freeze([
  {
    key: "pickup",
    name: "Pick-up patriot",
    description: "Un chauffeur ramasse des dollars pour vous.",
    image: "/images/upgrades/pickup.png",
    kind: "auto",
    effectValue: 1,
    basePrice: 20,
    priceMultiplier: 2.2
  },
  {
    key: "oil",
    name: "Pipeline prive",
    description: "Le cash coule sans que vous leviez le petit doigt.",
    image: "/images/upgrades/oil.png",
    kind: "auto",
    effectValue: 5,
    basePrice: 140,
    priceMultiplier: 2.25
  },
  {
    key: "wallStreet",
    name: "Desk Wall Street",
    description: "Un trader bosse pour votre compteur jour et nuit.",
    image: "/images/upgrades/wall-street.png",
    kind: "auto",
    effectValue: 18,
    basePrice: 700,
    priceMultiplier: 2.3
  },
  {
    key: "gold",
    name: "Gants en or",
    description: "Chaque clic rapporte nettement plus.",
    image: "/images/upgrades/gold.png",
    kind: "click",
    effectValue: 1,
    basePrice: 30,
    priceMultiplier: 2.15
  },
  {
    key: "diamond",
    name: "Bague diamant",
    description: "Vos clics prennent une toute autre ampleur.",
    image: "/images/upgrades/diamond.png",
    kind: "click",
    effectValue: 4,
    basePrice: 220,
    priceMultiplier: 2.25
  }
]);

function getUpgradeByKey(upgradeKey) {
  return UPGRADE_DEFINITIONS.find((upgrade) => upgrade.key === upgradeKey) ?? null;
}

module.exports = {
  DEFAULT_CLICK_MULTIPLIER,
  MAX_CLICKS_PER_SECOND,
  MAX_PRICE,
  UPGRADE_DEFINITIONS,
  getUpgradeByKey
};
