const passwordToggleButtons = document.querySelectorAll("[data-toggle-password]");

passwordToggleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const targetId = button.dataset.target;
    const field = document.getElementById(targetId);

    if (!field) {
      return;
    }

    const isHidden = field.type === "password";
    field.type = isHidden ? "text" : "password";
    button.setAttribute(
      "aria-label",
      isHidden ? "Masquer le mot de passe" : "Afficher le mot de passe"
    );
    button.classList.toggle("is-visible", isHidden);

    const icon = button.querySelector(".ph");

    if (icon) {
      icon.classList.toggle("ph-eye", !isHidden);
      icon.classList.toggle("ph-eye-slash", isHidden);
    }
  });
});
