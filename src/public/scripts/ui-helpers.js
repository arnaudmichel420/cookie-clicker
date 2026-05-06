window.createFeedbackController = function createFeedbackController(elementId) {
  const element = document.getElementById(elementId);

  return {
    set(message, kind) {
      element.textContent = message;
      element.dataset.kind = kind ?? "";
    }
  };
};

window.redirectTo = function redirectTo(path) {
  window.location.replace(path);
};
