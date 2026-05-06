(function attachGameEffects(windowObject) {
  const DOLLAR_IMAGE_SRC = "/images/effects/dollar.png";
  const FLAG_IMAGE_SRC = "/images/effects/america.png";
  const FIGHTER_IMAGE_SRC = "/images/effects/avion-chasse.png";
  const MISSILE_IMAGE_SRC = "/images/effects/missile.png";
  const SPAM_WINDOW_MS = 2000;
  const FIGHTER_THRESHOLD = 15;
  const MISSILE_THRESHOLD = 12;
  const FIGHTER_COOLDOWN_MS = 2000;
  const MISSILE_COOLDOWN_MS = 2000;
  const FLAG_RAIN_MIN_MS = 1800;
  const FLAG_RAIN_MAX_MS = 3000;
  const FLAG_RAIN_INTERVAL_MS = 160;
  const FLAG_STREAK_SECONDS = 10;
  const FLAG_RAIN_COOLDOWN_MS = FLAG_STREAK_SECONDS * 1000;

  function createGameEffects({ layer, characterLayer }) {
    let recentClicks = [];
    let lastFighterAt = 0;
    let lastMissileAt = 0;
    let secondBuckets = [];
    let lastFlagRainAt = 0;

    function cleanupAfterAnimation(element, durationMs) {
      windowObject.setTimeout(() => {
        element.remove();
      }, durationMs);
    }

    function spawnFallingAsset({ src, className, fixedRotation = null }) {
      const element = document.createElement("img");
      const scale = Number((0.6 + Math.random() * 0.8).toFixed(2));
      const durationMs = 1350 + Math.round(Math.random() * 350);
      const left = 6 + Math.random() * 74;
      const drift = Math.round(Math.random() * 140 - 70);
      const rotation =
        fixedRotation === null ? Math.round(Math.random() * 36 - 18) : fixedRotation;

      element.src = src;
      element.alt = "";
      element.className = className;
      element.draggable = false;
      element.style.setProperty("--effect-left", `${left}vw`);
      element.style.setProperty("--effect-scale", scale);
      element.style.setProperty("--effect-duration", `${durationMs}ms`);
      element.style.setProperty("--effect-drift", `${drift}px`);
      element.style.setProperty("--effect-rotation", `${rotation}deg`);
      layer.append(element);
      cleanupAfterAnimation(element, durationMs + 100);
    }

    function spawnDollar() {
      spawnFallingAsset({
        src: DOLLAR_IMAGE_SRC,
        className: "effect-dollar"
      });
    }

    function spawnMilestoneFlag() {
      const element = document.createElement("img");
      const scale = Number((0.9 + Math.random() * 1.2).toFixed(2));
      const durationMs = 1700 + Math.round(Math.random() * 600);
      const left = 4 + Math.random() * 82;
      const drift = Math.round(Math.random() * 200 - 100);

      element.src = FLAG_IMAGE_SRC;
      element.alt = "";
      element.className = "effect-flag effect-flag-milestone";
      element.draggable = false;
      element.style.setProperty("--effect-left", `${left}vw`);
      element.style.setProperty("--effect-scale", scale);
      element.style.setProperty("--effect-duration", `${durationMs}ms`);
      element.style.setProperty("--effect-drift", `${drift}px`);
      element.style.setProperty("--effect-rotation", "90deg");
      layer.append(element);
      cleanupAfterAnimation(element, durationMs + 100);
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

    function registerClickStreak() {
      const now = Date.now();
      const currentSecond = Math.floor(now / 1000);
      const lastBucket = secondBuckets.at(-1);

      if (!lastBucket || lastBucket.second !== currentSecond) {
        secondBuckets.push({
          second: currentSecond,
          count: 1
        });
      } else {
        lastBucket.count += 1;
      }

      secondBuckets = secondBuckets.filter(
        (bucket) => currentSecond - bucket.second < FLAG_STREAK_SECONDS
      );

      if (secondBuckets.length < FLAG_STREAK_SECONDS) {
        return;
      }

      const hasContinuousStreak = secondBuckets.every((bucket, index) => {
        const expectedSecond = currentSecond - (FLAG_STREAK_SECONDS - 1) + index;
        return bucket.second === expectedSecond && bucket.count >= 1;
      });

      if (hasContinuousStreak && now - lastFlagRainAt >= FLAG_RAIN_COOLDOWN_MS) {
        lastFlagRainAt = now;
        triggerFlagRain();
      }
    }

    function triggerFlagRain() {
      const durationMs =
        FLAG_RAIN_MIN_MS +
        Math.round(Math.random() * (FLAG_RAIN_MAX_MS - FLAG_RAIN_MIN_MS));
      const startedAt = Date.now();

      spawnMilestoneFlag();

      const intervalId = windowObject.setInterval(() => {
        spawnMilestoneFlag();

        if (Date.now() - startedAt >= durationMs) {
          windowObject.clearInterval(intervalId);
        }
      }, FLAG_RAIN_INTERVAL_MS);
    }

    return {
      triggerClickEffects() {
        spawnDollar();
        registerClickBurst();
        registerClickStreak();
      },
      triggerPurchaseEffects(purchaseEffect) {
        spawnFireworks(purchaseEffect);
      }
    };
  }

  windowObject.createGameEffects = createGameEffects;
})(window);
