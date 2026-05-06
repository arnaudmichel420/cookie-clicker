const feedback = window.createFeedbackController("feedback");
const sessionEmail = document.getElementById("session-email");
const sessionState = document.getElementById("session-state");
const logoutButton = document.getElementById("logout-button");

async function initializeAccountPage() {
  const session = await window.authClient.restoreSession();

  if (!session.isAuthenticated) {
    feedback.set(window.AUTH_MESSAGES.accountExpired, "error");
    window.redirectTo(window.AUTH_ROUTES.login);
    return;
  }

  sessionEmail.textContent = session.user?.email ?? "-";
  sessionState.textContent = "Connecte";
  feedback.set(window.AUTH_MESSAGES.accountActive, "success");
}

logoutButton.addEventListener("click", async () => {
  await window.authClient.logout();
  feedback.set(window.AUTH_MESSAGES.logoutSuccess, "success");
  window.redirectTo(window.AUTH_ROUTES.login);
});

initializeAccountPage();
