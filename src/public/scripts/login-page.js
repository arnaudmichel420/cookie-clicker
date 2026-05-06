const loginForm = document.getElementById("login-form");
const feedback = window.createFeedbackController("feedback");

async function initializeLoginPage() {
  const session = await window.authClient.restoreSession();

  if (session.isAuthenticated) {
    window.redirectTo(window.AUTH_ROUTES.account);
    return;
  }

  feedback.set(window.AUTH_MESSAGES.loginDefault);
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
    feedback.set(data.error ?? window.AUTH_MESSAGES.loginError, "error");
    return;
  }

  window.authClient.setToken(data.token);
  feedback.set(window.AUTH_MESSAGES.loginSuccess, "success");
  window.redirectTo(window.AUTH_ROUTES.game);
});

initializeLoginPage();
