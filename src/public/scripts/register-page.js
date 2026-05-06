const registerForm = document.getElementById("register-form");
const feedback = window.createFeedbackController("feedback");

async function initializeRegisterPage() {
  const session = await window.authClient.restoreSession();

  if (session.isAuthenticated) {
    window.redirectTo(window.AUTH_ROUTES.account);
    return;
  }

  feedback.set(window.AUTH_MESSAGES.registerDefault);
}

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(registerForm);
  const password = formData.get("password");
  const passwordConfirmation = formData.get("passwordConfirmation");

  if (password !== passwordConfirmation) {
    feedback.set(window.AUTH_MESSAGES.registerMismatch, "error");
    return;
  }

  const payload = {
    email: formData.get("email"),
    password
  };

  const { response, data } = await window.authClient.register(payload);

  if (!response.ok) {
    feedback.set(data.error ?? window.AUTH_MESSAGES.registerError, "error");
    return;
  }

  registerForm.reset();
  feedback.set(window.AUTH_MESSAGES.registerSuccess, "success");
  window.redirectTo(window.AUTH_ROUTES.login);
});

initializeRegisterPage();
