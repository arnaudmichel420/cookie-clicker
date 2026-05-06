const loginForm = document.getElementById("login-form");
const feedback = document.getElementById("feedback");

function setFeedback(message, kind) {
  feedback.textContent = message;
  feedback.dataset.kind = kind ?? "";
}

async function initializeLoginPage() {
  const session = await window.authClient.restoreSession();

  if (session.isAuthenticated) {
    window.location.replace("/account");
    return;
  }

  setFeedback("Connectez-vous pour retrouver votre session.");
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const payload = {
    email: formData.get("email"),
    password: formData.get("password")
  };

  const { response, data } = await window.authClient.login(payload);

  if (!response.ok) {
    setFeedback(data.error ?? "Connexion impossible.", "error");
    return;
  }

  window.authClient.setToken(data.token);
  setFeedback("Connexion réussie. Redirection en cours.", "success");
  window.location.replace("/account");
});

initializeLoginPage();
