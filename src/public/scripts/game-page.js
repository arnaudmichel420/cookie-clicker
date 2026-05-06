(function initializeGamePage() {
  const cookieButton = document.getElementById("cookie-button");
  const cookieCount = document.getElementById("cookie-count");
  const cookiesPerSecond = document.getElementById("cookies-per-second");
  const cookiesPerClick = document.getElementById("cookies-per-click");
  const upgradeCount = document.getElementById("upgrade-count");
  const feedback = document.getElementById("game-feedback");
  const effectsLayer = document.getElementById("effects-layer");
  const characterEffects = document.getElementById("character-effects");
  const gameShell = document.querySelector(".game-shell");
  const shopClose = document.getElementById("shop-close");
  const shopToggle = document.getElementById("shop-toggle");
  const shopFilters = Array.from(document.querySelectorAll("[data-upgrade-filter]"));
  const upgradeCards = Array.from(document.querySelectorAll("[data-upgrade-key]"));
  const frames = [
    document.getElementById("trump-frame-a"),
    document.getElementById("trump-frame-b")
  ];
  const trumpCharacter = window.createTrumpCharacter({
    button: cookieButton,
    frames: frames
  });
  const gameEffects = window.createGameEffects({
    layer: effectsLayer,
    characterLayer: characterEffects
  const gameSoundEffects = window.createGameSoundEffects({
    Audio: window.Audio
  });
  let stateRefreshHandle = null;
  let activeFilter = null;

  function setFeedback(message, state) {
    const nextState = state === undefined ? "info" : state;
    feedback.textContent = message;
    feedback.dataset.state = nextState;
  }

  function renderUpgradeCard(stats, card) {
    const upgrade = stats.upgrades.find(
      (candidate) => candidate.key === card.dataset.upgradeKey
    );

    if (!upgrade) {
      return;
    }

    const ownedLabel = card.querySelector("[data-upgrade-owned]");
    const priceLabel = card.querySelector("[data-upgrade-price-label]");
    const buyButton = card.querySelector("[data-upgrade-buy]");
    const canAfford = stats.cookies >= upgrade.currentPrice;

    ownedLabel.textContent = upgrade.owned;
    priceLabel.textContent = `$${upgrade.currentPrice}`;
    buyButton.disabled = !canAfford;
    buyButton.dataset.upgradePrice = String(upgrade.currentPrice);
  }

  function renderStats(data) {
    cookieCount.textContent = `$${data.cookies}`;
    cookiesPerSecond.textContent = data.cookiesPerSecond;
    cookiesPerClick.textContent = data.cookiesPerClick;
    upgradeCount.textContent = data.upgradeCount;
    upgradeCards.forEach((card) => renderUpgradeCard(data, card));
  }

  function applyUpgradeFilter(nextFilter) {
    const resolvedFilter = nextFilter === undefined ? null : nextFilter;
    activeFilter = resolvedFilter;

    for (const filterButton of shopFilters) {
      filterButton.classList.toggle(
        "is-active",
        resolvedFilter !== null && filterButton.dataset.upgradeFilter === resolvedFilter
      );
    }

    for (const card of upgradeCards) {
      const shouldShow =
        resolvedFilter === null || card.dataset.upgradeFilterKind === resolvedFilter;
      card.hidden = !shouldShow;
    }
  }

  function setShopCollapsed(isCollapsed) {
    gameShell.classList.toggle("is-shop-collapsed", isCollapsed);
    shopToggle.setAttribute(
      "aria-label",
      isCollapsed ? "Ouvrir la boutique" : "Rétracter la boutique"
    );
  }

  function disableGame(message) {
    setFeedback(message, "error");
    cookieButton.disabled = true;

    for (const card of upgradeCards) {
      const buyButton = card.querySelector("[data-upgrade-buy]");
      buyButton.disabled = true;
    }

    if (stateRefreshHandle) {
      window.clearInterval(stateRefreshHandle);
    }
  }

  function handleGameError(response, data, fallbackMessage) {
    if (!response.ok) {
      disableGame(data.error || fallbackMessage);
      return true;
    }

    return false;
  }

  async function requestGameState() {
    const { response, data } = await window.gameClient.getState();

    if (handleGameError(response, data, window.GAME_MESSAGES.sessionExpired)) {
      return;
    }

    renderStats(data);
  }

  async function clickCookie() {
    gameSoundEffects.startBackgroundMusic();

    const { response, data } = await window.gameClient.clickCookie();

    if (handleGameError(response, data, window.GAME_MESSAGES.clickError)) {
      return;
    }

    renderStats(data);
    setFeedback("");
    gameSoundEffects.playClickSound();

    if (data.shouldAnimate) {
      trumpCharacter.morph();
      gameEffects.triggerClickEffects();
    }
  }

  async function purchaseUpgrade(upgradeKey) {
    gameSoundEffects.startBackgroundMusic();

    const { response, data } = await window.gameClient.purchaseUpgrade(upgradeKey);

    if (!response.ok) {
      setFeedback(data.error || window.GAME_MESSAGES.purchaseError, "error");
      return;
    }

    renderStats(data);
    setFeedback(window.GAME_MESSAGES.upgradePurchased, "success");
    gameEffects.triggerPurchaseEffects(data.purchaseEffect);
    gameSoundEffects.playUpgradeSound();
  }

  cookieButton.addEventListener("click", clickCookie);

  for (const card of upgradeCards) {
    card.querySelector("[data-upgrade-buy]").addEventListener("click", () => {
      purchaseUpgrade(card.dataset.upgradeKey);
    });
  }

  for (const filterButton of shopFilters) {
    filterButton.addEventListener("click", () => {
      applyUpgradeFilter(filterButton.dataset.upgradeFilter);
      setShopCollapsed(false);
    });
  }

  shopToggle.addEventListener("click", () => {
    const isCollapsed = gameShell.classList.contains("is-shop-collapsed");

    if (isCollapsed) {
      setShopCollapsed(false);
      applyUpgradeFilter(null);
      return;
    }

    setShopCollapsed(true);
  });

  shopClose.addEventListener("click", () => {
    setShopCollapsed(true);
  });

  applyUpgradeFilter(activeFilter);
  requestGameState();
  stateRefreshHandle = window.setInterval(requestGameState, 1000);
})();
