const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const SOUND_EFFECTS_SCRIPT_PATH = path.join(
  process.cwd(),
  "src/public/scripts/sound-effects.js"
);

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

function createAudioMock(playFactory = () => Promise.resolve()) {
  const instances = [];

  function AudioMock(source) {
    this.listeners = {};
    this.loop = false;
    this.source = source;
    this.volume = 1;
    this.addEventListener = vi.fn((eventName, listener) => {
      this.listeners[eventName] = listener;
    });
    this.play = vi.fn(() => playFactory(this));
    this.removeEventListener = vi.fn((eventName) => {
      delete this.listeners[eventName];
    });
    this.emit = (eventName) => {
      this.listeners[eventName]?.();
    };
    instances.push(this);
  }

  return {
    AudioMock,
    instances
  };
}

function createSoundEffects({ Audio, now, random, soundEffects } = {}) {
  const windowObject = {
    Audio,
    SOUND_EFFECTS: soundEffects ?? {
      background: "/sounds/usa-anthem.mp3",
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
    now,
    random,
    soundEffects: windowObject.SOUND_EFFECTS
  });
}

describe("soundEffects - cas nominaux", () => {
  it("TU 1 - lance un son quand l'utilisateur clique sur Trump", async () => {
    const { AudioMock, instances } = createAudioMock();
    const soundEffects = createSoundEffects({
      Audio: AudioMock,
      random: () => 0
    });

    await soundEffects.playClickSound();

    expect(instances).toHaveLength(1);
    expect(instances[0].source).toBe("/sounds/click/first.mp3");
    expect(instances[0].volume).toBe(0.09);
    expect(instances[0].play).toHaveBeenCalledTimes(1);
  });

  it("TU 2 - limite les sons de clic a deux par seconde", async () => {
    const { AudioMock, instances } = createAudioMock();
    const randomValues = [0, 0.75, 0];
    const nowValues = [1000, 1000, 1000, 2000];
    const soundEffects = createSoundEffects({
      Audio: AudioMock,
      now: () => nowValues.shift(),
      random: () => randomValues.shift()
    });

    await expect(soundEffects.playClickSound()).resolves.toBe(true);
    await expect(soundEffects.playClickSound()).resolves.toBe(true);
    await expect(soundEffects.playClickSound()).resolves.toBe(false);
    await expect(soundEffects.playClickSound()).resolves.toBe(true);

    expect(instances).toHaveLength(3);
    expect(instances[0].source).toBe("/sounds/click/first.mp3");
    expect(instances[1].source).toBe("/sounds/click/second.mp3");
    expect(instances[2].source).toBe("/sounds/click/first.mp3");
  });

  it("TU 3 - lance un son quand l'utilisateur achete une upgrade", async () => {
    const { AudioMock, instances } = createAudioMock();
    const soundEffects = createSoundEffects({
      Audio: AudioMock,
      random: () => 0
    });

    const playback = soundEffects.playUpgradeSound();

    await flushPromises();

    expect(instances).toHaveLength(1);
    expect(instances[0].source).toBe("/sounds/upgrades/first.mp3");
    expect(instances[0].volume).toBe(1);
    expect(instances[0].play).toHaveBeenCalledTimes(1);

    instances[0].emit("ended");
    await playback;
  });

  it("TU 4 - attend la fin du premier son d'upgrade avant de lancer le suivant", async () => {
    const randomValues = [0, 0.75];
    const { AudioMock, instances } = createAudioMock();
    const soundEffects = createSoundEffects({
      Audio: AudioMock,
      random: () => randomValues.shift()
    });

    const firstPlayback = soundEffects.playUpgradeSound();
    const secondPlayback = soundEffects.playUpgradeSound();

    await flushPromises();

    expect(instances).toHaveLength(1);

    instances[0].emit("ended");
    await firstPlayback;
    await flushPromises();

    expect(instances).toHaveLength(2);

    instances[1].emit("ended");
    await secondPlayback;
  });

  it("TU 5 - lance une musique de fond en boucle a volume reduit", async () => {
    const { AudioMock, instances } = createAudioMock();
    const soundEffects = createSoundEffects({ Audio: AudioMock });

    await expect(soundEffects.startBackgroundMusic()).resolves.toBe(true);

    expect(instances).toHaveLength(1);
    expect(instances[0].source).toBe("/sounds/usa-anthem.mp3");
    expect(instances[0].loop).toBe(true);
    expect(instances[0].volume).toBe(0.09);
    expect(instances[0].play).toHaveBeenCalledTimes(1);
  });

  it("TU 6 - ne relance pas la musique de fond si elle est deja demarree", async () => {
    const { AudioMock, instances } = createAudioMock();
    const soundEffects = createSoundEffects({ Audio: AudioMock });

    await soundEffects.startBackgroundMusic();
    await soundEffects.startBackgroundMusic();

    expect(instances).toHaveLength(1);
    expect(instances[0].play).toHaveBeenCalledTimes(1);
  });
});

describe("soundEffects - cas d'erreur", () => {
  it("TU 7 - ne bloque pas le jeu si l'API Audio est indisponible", async () => {
    const soundEffects = createSoundEffects({ Audio: undefined });

    await expect(soundEffects.playClickSound()).resolves.toBe(false);
  });

  it("TU 8 - ignore une erreur de lecture audio", async () => {
    const { AudioMock } = createAudioMock(() => Promise.reject(new Error("Lecture refusee")));
    const soundEffects = createSoundEffects({ Audio: AudioMock });

    await expect(soundEffects.playUpgradeSound()).resolves.toBe(false);
  });
});

describe("soundEffects - cas limites", () => {
  it("TU 9 - ne lance rien si aucune source sonore n'est configuree", async () => {
    const { AudioMock, instances } = createAudioMock();
    const soundEffects = createSoundEffects({
      Audio: AudioMock,
      soundEffects: {
        background: null,
        click: [],
        upgrade: []
      }
    });

    await expect(soundEffects.playClickSound()).resolves.toBe(false);
    await expect(soundEffects.playUpgradeSound()).resolves.toBe(false);
    await expect(soundEffects.startBackgroundMusic()).resolves.toBe(false);
    expect(instances).toHaveLength(0);
  });

  it("TU 10 - expose seulement les methodes audio explicites", () => {
    const { AudioMock } = createAudioMock();
    const soundEffects = createSoundEffects({ Audio: AudioMock });

    expect(Object.keys(soundEffects)).toEqual([
      "playClickSound",
      "playUpgradeSound",
      "startBackgroundMusic"
    ]);
  });
});
