(function attachGameSoundEffects(windowObject) {
  const BACKGROUND_MUSIC_VOLUME = 0.09;
  const CLICK_SOUND_VOLUME = 0.09;
  const CLICK_SOUND_LIMIT_PER_SECOND = 2;

  function pickRandomSource(sources = [], random = Math.random) {
    if (sources.length === 0) {
      return null;
    }

    const index = Math.floor(random() * sources.length);

    return sources[Math.min(index, sources.length - 1)];
  }

  function createGameSoundEffects({
    Audio,
    now = Date.now,
    random = Math.random,
    soundEffects = windowObject.SOUND_EFFECTS,
  } = {}) {
    let upgradeQueue = Promise.resolve();
    let backgroundMusic = null;
    let hasStartedBackgroundMusic = false;
    let clickSoundSecond = null;
    let clickSoundsPlayedThisSecond = 0;

    function playSource(source, { volume = 1, waitForEnd = false } = {}) {
      if (!source || typeof Audio !== "function") {
        return Promise.resolve(false);
      }

      try {
        const audio = new Audio(source);
        audio.volume = volume;
        const playResult = audio.play();

        return Promise.resolve(playResult)
          .then(() => {
            if (!waitForEnd || typeof audio.addEventListener !== "function") {
              return true;
            }

            return new Promise((resolve) => {
              function cleanup() {
                audio.removeEventListener?.("ended", handleEnded);
                audio.removeEventListener?.("error", handleError);
              }

              function handleEnded() {
                cleanup();
                resolve(true);
              }

              function handleError() {
                cleanup();
                resolve(false);
              }

              audio.addEventListener("ended", handleEnded);
              audio.addEventListener("error", handleError);
            });
          })
          .catch(() => false);
      } catch {
        return Promise.resolve(false);
      }
    }

    function startBackgroundMusic() {
      if (hasStartedBackgroundMusic) {
        return Promise.resolve(true);
      }

      if (!soundEffects.background || typeof Audio !== "function") {
        return Promise.resolve(false);
      }

      try {
        backgroundMusic = new Audio(soundEffects.background);
        backgroundMusic.loop = true;
        backgroundMusic.volume = BACKGROUND_MUSIC_VOLUME;

        return Promise.resolve(backgroundMusic.play())
          .then(() => {
            hasStartedBackgroundMusic = true;
            return true;
          })
          .catch(() => false);
      } catch {
        return Promise.resolve(false);
      }
    }

    function playClickSound() {
      const currentSecond = Math.floor(now() / 1000);

      if (clickSoundSecond !== currentSecond) {
        clickSoundSecond = currentSecond;
        clickSoundsPlayedThisSecond = 0;
      }

      if (clickSoundsPlayedThisSecond >= CLICK_SOUND_LIMIT_PER_SECOND) {
        return Promise.resolve(false);
      }

      clickSoundsPlayedThisSecond += 1;

      return playSource(pickRandomSource(soundEffects.click, random), {
        volume: CLICK_SOUND_VOLUME,
      });
    }

    function playUpgradeSound() {
      const source = pickRandomSource(soundEffects.upgrade, random);
      const queuedSound = upgradeQueue.then(() => playSource(source, { waitForEnd: true }));

      upgradeQueue = queuedSound.catch(() => false).then(() => undefined);

      return queuedSound;
    }

    return {
      playClickSound,
      playUpgradeSound,
      startBackgroundMusic,
    };
  }

  windowObject.createGameSoundEffects = createGameSoundEffects;
})(window);
