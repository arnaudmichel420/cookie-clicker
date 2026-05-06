(function attachGameEffects(windowObject) {
  const DOLLAR_IMAGE_SRC = "/images/effects/dollar.png";
  const FIGHTER_IMAGE_SRC = "/images/effects/avion-chasse.png";
  const MISSILE_IMAGE_SRC = "/images/effects/missile.png";
  const SPAM_WINDOW_MS = 2000;
  const FIGHTER_THRESHOLD = 15;
  const MISSILE_THRESHOLD = 12;
  const FIGHTER_COOLDOWN_MS = 2000;
  const MISSILE_COOLDOWN_MS = 2000;

  function createGameEffects({ layer, characterLayer }) {
    let recentClicks = [];
    let lastFighterAt = 0;
    let lastMissileAt = 0;

    function cleanupAfterAnimation(element, durationMs) {
      windowObject.setTimeout(() => {
        element.remove();
      }, durationMs);
    }

    function spawnDollar() {
      const dollar = document.createElement("img");
      const scale = Number((0.6 + Math.random() * 0.8).toFixed(2));
      const durationMs = 1350 + Math.round(Math.random() * 350);
      const left = 6 + Math.random() * 74;
      const drift = Math.round(Math.random() * 140 - 70);
      const rotation = Math.round(Math.random() * 36 - 18);

      dollar.src = DOLLAR_IMAGE_SRC;
      dollar.alt = "";
      dollar.className = "effect-dollar";
      dollar.draggable = false;
      dollar.style.setProperty("--effect-left", `${left}vw`);
      dollar.style.setProperty("--effect-scale", scale);
      dollar.style.setProperty("--effect-duration", `${durationMs}ms`);
      dollar.style.setProperty("--effect-drift", `${drift}px`);
      dollar.style.setProperty("--effect-rotation", `${rotation}deg`);
      layer.append(dollar);
      cleanupAfterAnimation(dollar, durationMs + 100);
    }

    function spawnFighterJet() {
      const now = Date.now();

      if (now - lastFighterAt < FIGHTER_COOLDOWN_MS) {
        return;
      }

      lastFighterAt = now;

      const fighter = document.createElement("img");

      fighter.src = FIGHTER_IMAGE_SRC;
      fighter.alt = "";
      fighter.className = "effect-fighter";
      fighter.draggable = false;
      layer.append(fighter);
      cleanupAfterAnimation(fighter, 2500);
    }

    function spawnMissileUnit({ offsetX = 0, offsetY = 0, scale = 1 } = {}) {
      const missile = document.createElement("img");

      missile.src = MISSILE_IMAGE_SRC;
      missile.alt = "";
      missile.className = "effect-missile";
      missile.draggable = false;
      missile.style.setProperty("--missile-offset-x", `${offsetX}px`);
      missile.style.setProperty("--missile-offset-y", `${offsetY}px`);
      missile.style.setProperty("--missile-scale", scale);
      layer.append(missile);
      cleanupAfterAnimation(missile, 2200);
    }

    function spawnMissile() {
      const now = Date.now();

      if (now - lastMissileAt < MISSILE_COOLDOWN_MS) {
        return;
      }

      lastMissileAt = now;
      spawnMissileUnit();
      spawnMissileUnit({
        offsetX: 46,
        offsetY: -24,
        scale: 0.88
      });
      spawnMissileUnit({
        offsetX: 78,
        offsetY: 22,
        scale: 0.82
      });
    }

    function spawnFireworkParticle({ left, top, size, hue, x, y, durationMs }) {
      const particle = document.createElement("span");

      particle.className = "effect-firework-particle";
      particle.style.setProperty("--firework-left", `${left}%`);
      particle.style.setProperty("--firework-top", `${top}%`);
      particle.style.setProperty("--firework-size", `${size}px`);
      particle.style.setProperty("--firework-hue", `${hue}`);
      particle.style.setProperty("--firework-x", `${x}px`);
      particle.style.setProperty("--firework-y", `${y}px`);
      particle.style.setProperty("--firework-duration", `${durationMs}ms`);
      characterLayer.append(particle);
      cleanupAfterAnimation(particle, durationMs + 120);
    }

    function spawnFireworks(purchaseEffect) {
      if (!characterLayer || !purchaseEffect) {
        return;
      }

      const baseBurstCount = Math.max(
        8,
        Math.min(26, Math.round(purchaseEffect.basePrice / 45) + purchaseEffect.ownedCount * 2)
      );
      const burstCount = Math.min(baseBurstCount, 30);
      const sizeBoost = Math.min(26, purchaseEffect.ownedCount * 2 + purchaseEffect.basePrice / 80);
      const burstOrigins = Math.max(2, Math.min(5, Math.round(purchaseEffect.basePrice / 180)));

      for (let originIndex = 0; originIndex < burstOrigins; originIndex += 1) {
        const left = 24 + Math.random() * 52;
        const top = 8 + Math.random() * 24;

        for (let particleIndex = 0; particleIndex < burstCount; particleIndex += 1) {
          const angle = (Math.PI * 2 * particleIndex) / burstCount + Math.random() * 0.35;
          const distance = 44 + Math.random() * (46 + sizeBoost * 2);
          const hue = 20 + Math.round(Math.random() * 55);
          const size = 8 + Math.random() * 9 + sizeBoost * 0.18;
          const durationMs = 900 + Math.round(Math.random() * 420);

          spawnFireworkParticle({
            left,
            top,
            size,
            hue,
            x: Math.cos(angle) * distance,
            y: Math.sin(angle) * distance - 36,
            durationMs
          });
        }
      }
    }

    function registerClickBurst() {
      const now = Date.now();

      recentClicks = recentClicks.filter((timestamp) => now - timestamp <= SPAM_WINDOW_MS);
      recentClicks.push(now);

      if (recentClicks.length >= MISSILE_THRESHOLD) {
        spawnMissile();
      }

      if (recentClicks.length >= FIGHTER_THRESHOLD) {
        spawnFighterJet();
      }
    }

    return {
      triggerClickEffects() {
        spawnDollar();
        registerClickBurst();
      },
      triggerPurchaseEffects(purchaseEffect) {
        spawnFireworks(purchaseEffect);
      }
    };
  }

  windowObject.createGameEffects = createGameEffects;
})(window);
