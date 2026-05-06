const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SOUND_EFFECTS_SCRIPT_PATH = path.join(
  process.cwd(),
  "src/public/scripts/sound-effects.js"
);

function createDeferred() {
  const deferred = {};

  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });

  return deferred;
}

function createAudioMock(playFactory = () => Promise.resolve()) {
  const instances = [];

  function AudioMock(source) {
    this.source = source;
    this.play = vi.fn(() => playFactory(this));
    instances.push(this);
  }

  return {
    AudioMock,
    instances
  };
}

function createSoundEffects({ Audio, soundEffects } = {}) {
  const windowObject = {
    Audio,
    SOUND_EFFECTS: soundEffects ?? {
      click: ["/sounds/click/first.mp3", "/sounds/click/second.mp3"],
      upgrade: ["/sounds/upgrades/first.mp3", "/sounds/upgrades/second.mp3"]
    }
  };
  const script = fs.readFileSync(SOUND_EFFECTS_SCRIPT_PATH, "utf8");

  vm.runInNewContext(script, {
    window: windowObject,
    Promise
  });

  return windowObject.createGameSoundEffects({
    Audio,
    soundEffects: windowObject.SOUND_EFFECTS
  });
}

describe("soundEffects - cas nominaux", () => {
  it("TU 1 - lance un son quand l'utilisateur clique sur Trump", async () => {
    const { AudioMock, instances } = createAudioMock();
    const soundEffects = createSoundEffects({ Audio: AudioMock });

    await soundEffects.playClickSound();

    expect(instances).toHaveLength(1);
    expect(instances[0].source).toBe("/sounds/click/first.mp3");
    expect(instances[0].play).toHaveBeenCalledTimes(1);
  });

  it("TU 2 - superpose les sons quand l'utilisateur spamme les clics", () => {
    const { AudioMock, instances } = createAudioMock(() => createDeferred().promise);
    const soundEffects = createSoundEffects({ Audio: AudioMock });

    soundEffects.playClickSound();
    soundEffects.playClickSound();

    expect(instances).toHaveLength(2);
    expect(instances[0].source).toBe("/sounds/click/first.mp3");
    expect(instances[1].source).toBe("/sounds/click/second.mp3");
  });

  it("TU 3 - lance un son quand l'utilisateur achete une upgrade", async () => {
    const { AudioMock, instances } = createAudioMock();
    const soundEffects = createSoundEffects({ Audio: AudioMock });

    await soundEffects.playUpgradeSound();

    expect(instances).toHaveLength(1);
    expect(instances[0].source).toBe("/sounds/upgrades/first.mp3");
    expect(instances[0].play).toHaveBeenCalledTimes(1);
  });

  it("TU 4 - joue deux sons d'upgrade l'un apres l'autre", async () => {
    const firstSound = createDeferred();
    const secondSound = createDeferred();
    const queuedSounds = [firstSound, secondSound];
    const { AudioMock, instances } = createAudioMock(() => queuedSounds.shift().promise);
    const soundEffects = createSoundEffects({ Audio: AudioMock });

    const firstPlayback = soundEffects.playUpgradeSound();
    const secondPlayback = soundEffects.playUpgradeSound();

    await Promise.resolve();

    expect(instances).toHaveLength(1);

    firstSound.resolve();
    await firstPlayback;
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(instances).toHaveLength(2);

    secondSound.resolve();
    await secondPlayback;
  });
});

describe("soundEffects - cas d'erreur", () => {
  it("TU 5 - ne bloque pas le jeu si l'API Audio est indisponible", async () => {
    const soundEffects = createSoundEffects({ Audio: undefined });

    await expect(soundEffects.playClickSound()).resolves.toBe(false);
  });

  it("TU 6 - ignore une erreur de lecture audio", async () => {
    const { AudioMock } = createAudioMock(() => Promise.reject(new Error("Lecture refusee")));
    const soundEffects = createSoundEffects({ Audio: AudioMock });

    await expect(soundEffects.playUpgradeSound()).resolves.toBe(false);
  });
});

describe("soundEffects - cas limites", () => {
  it("TU 7 - ne lance rien si aucune source sonore n'est configuree", async () => {
    const { AudioMock, instances } = createAudioMock();
    const soundEffects = createSoundEffects({
      Audio: AudioMock,
      soundEffects: {
        click: [],
        upgrade: []
      }
    });

    await expect(soundEffects.playClickSound()).resolves.toBe(false);
    await expect(soundEffects.playUpgradeSound()).resolves.toBe(false);
    expect(instances).toHaveLength(0);
  });

  it("TU 8 - n'expose aucune methode appelee par l'autocliqueur", () => {
    const { AudioMock } = createAudioMock();
    const soundEffects = createSoundEffects({ Audio: AudioMock });

    expect(Object.keys(soundEffects)).toEqual(["playClickSound", "playUpgradeSound"]);
  });
});
