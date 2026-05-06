(function initializeGamePage() {
  const cookieButton = document.getElementById("cookie-button");
  const cookieCount = document.getElementById("cookie-count");
  const cookiesPerSecond = document.getElementById("cookies-per-second");
  const feedback = document.getElementById("game-feedback");
  const gameShell = document.querySelector(".game-shell");
  const shopToggle = document.getElementById("shop-toggle");
  const frames = [
    document.getElementById("trump-frame-a"),
    document.getElementById("trump-frame-b")
  ];
  const trumpCharacter = window.createTrumpCharacter({
    button: cookieButton,
    frames
  });

  function setFeedback(message, state = "info") {
    feedback.textContent = message;
    feedback.dataset.state = state;
  }

  function renderStats(data) {
    cookieCount.textContent = `$${data.cookies}`;
    cookiesPerSecond.textContent = data.cookiesPerSecond;
    setFeedback("");
  }

  function disableGame(message) {
    setFeedback(message, "error");
    cookieButton.disabled = true;
  }

  function handleGameError(response, data, fallbackMessage) {
    if (!response.ok) {
      disableGame(data.error ?? fallbackMessage);
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
    const { response, data } = await window.gameClient.clickCookie();

    if (handleGameError(response, data, window.GAME_MESSAGES.clickError)) {
      return;
    }

    renderStats(data);

    if (data.shouldAnimate) {
      trumpCharacter.morph();
    }
  }

  cookieButton.addEventListener("click", clickCookie);
  shopToggle.addEventListener("click", () => {
    const isCollapsed = gameShell.classList.toggle("is-shop-collapsed");

    shopToggle.setAttribute(
      "aria-label",
      isCollapsed ? "Ouvrir la boutique" : "Rétracter la boutique"
    );
  });
  requestGameState();
})();
