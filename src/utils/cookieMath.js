function incrementCookies(currentCookies, cookiesPerClick = 1) {
  return currentCookies + cookiesPerClick;
}

function formatAmount(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }

  const units = [
    {
      value: 1000000000000,
      suffix: "T"
    },
    {
      value: 1000000000,
      suffix: "Md"
    },
    {
      value: 1000000,
      suffix: "M"
    },
    {
      value: 1000,
      suffix: "K"
    }
  ];
  const unit = units.find((candidate) => value >= candidate.value);

  if (!unit) {
    return String(Math.floor(value));
  }

  const formatted = (value / unit.value).toFixed(1).replace(/\.0$/, "");

  return `${formatted}${unit.suffix}`;
}

module.exports = {
  formatAmount,
  incrementCookies
};
