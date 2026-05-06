(function attachTrumpCharacter(windowObject) {
  const trumpImages = [
    "/images/trump/trump-1%202.webp",
    "/images/trump/trump-2%202.webp",
    "/images/trump/trump-3%202.webp"
  ];

  function getRandomMotion() {
    const rotation = Math.round((Math.random() * 18 - 9) * 10) / 10;
    const scale = Math.round((0.94 + Math.random() * 0.16) * 100) / 100;

    return {
      rotation,
      scale
    };
  }

  function createTrumpCharacter({ button, frames }) {
    let imageIndex = 0;
    let activeFrameIndex = 0;

    return {
      morph() {
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
        button.classList.remove("is-clicking");
        void button.offsetWidth;
        button.classList.add("is-clicking");
        activeFrameIndex = nextFrameIndex;
      }
    };
  }

  windowObject.createTrumpCharacter = createTrumpCharacter;
})(window);
