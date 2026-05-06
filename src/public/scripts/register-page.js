const registerForm = document.getElementById("register-form");
const feedback = document.getElementById("feedback");

function setFeedback(message, kind) {
  feedback.textContent = message;
  feedback.dataset.kind = kind ?? "";
}

async function initializeRegisterPage() {
  const session = await window.authClient.restoreSession();

  if (session.isAuthenticated) {
    window.location.replace("/account");
    return;
  }

  setFeedback("Créez votre compte puis connectez-vous.");
}

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(registerForm);
  const password = formData.get("password");
  const passwordConfirmation = formData.get("passwordConfirmation");

  if (password !== passwordConfirmation) {
    setFeedback("Les mots de passe ne correspondent pas.", "error");
    return;
  }

  const payload = {
    email: formData.get("email"),
    password
  };

  const { response, data } = await window.authClient.register(payload);

  if (!response.ok) {
    setFeedback(data.error ?? "Impossible de créer le compte.", "error");
    return;
  }

  registerForm.reset();
  setFeedback("Compte créé. Redirection vers la connexion.", "success");
  window.location.replace("/login");
});

initializeRegisterPage();
