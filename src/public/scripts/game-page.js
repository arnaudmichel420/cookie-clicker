(function initializeGamePage() {
  const trumpImages = [
    "/images/trump/trump-1%202.webp",
    "/images/trump/trump-2%202.webp",
    "/images/trump/trump-3%202.webp"
  ];
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
  let imageIndex = 0;
  let activeFrameIndex = 0;

  function setFeedback(message, state = "info") {
    feedback.textContent = message;
    feedback.dataset.state = state;
  }

  function getRandomMotion() {
    const rotation = Math.round((Math.random() * 18 - 9) * 10) / 10;
    const scale = Math.round((0.94 + Math.random() * 0.16) * 100) / 100;

    return {
      rotation,
      scale
    };
  }

  function morphCharacter() {
    const nextFrameIndex = activeFrameIndex === 0 ? 1 : 0;
    const activeFrame = frames[activeFrameIndex];
    const nextFrame = frames[nextFrameIndex];
    const motion = getRandomMotion();

    imageIndex = (imageIndex + 1) % trumpImages.length;
    nextFrame.src = trumpImages[imageIndex];
    nextFrame.style.setProperty("--trump-rotation", `${motion.rotation}deg`);
    nextFrame.style.setProperty("--trump-scale", motion.scale);
    nextFrame.classList.add("trump-frame-active");
    activeFrame.classList.remove("trump-frame-active");
    cookieButton.classList.remove("is-clicking");
    void cookieButton.offsetWidth;
    cookieButton.classList.add("is-clicking");
    activeFrameIndex = nextFrameIndex;
  }

  async function requestGameState() {
    const token = window.authClient.getToken();

    if (!token) {
      setFeedback("Connectez-vous pour jouer.", "error");
      cookieButton.disabled = true;
      return;
    }

    const { response, data } = await window.authClient.requestJson("/game/state", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      setFeedback(data.error ?? "Session expirée.", "error");
      cookieButton.disabled = true;
      return;
    }

    cookieCount.textContent = `$${data.cookies}`;
    cookiesPerSecond.textContent = data.cookiesPerSecond;
    setFeedback("");
  }

  async function clickCookie() {
    const token = window.authClient.getToken();

    if (!token) {
      setFeedback("Connectez-vous pour jouer.", "error");
      cookieButton.disabled = true;
      return;
    }

    const { response, data } = await window.authClient.requestJson("/game/click", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!response.ok) {
      setFeedback(data.error ?? "Clic refusé.", "error");
      return;
    }

    cookieCount.textContent = `$${data.cookies}`;
    cookiesPerSecond.textContent = data.cookiesPerSecond;
    setFeedback("");

    if (data.shouldAnimate) {
      morphCharacter();
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
