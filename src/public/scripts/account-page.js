const feedback = document.getElementById("feedback");
const sessionEmail = document.getElementById("session-email");
const sessionState = document.getElementById("session-state");
const logoutButton = document.getElementById("logout-button");

function setFeedback(message, kind) {
  feedback.textContent = message;
  feedback.dataset.kind = kind ?? "";
}

async function initializeAccountPage() {
  const session = await window.authClient.restoreSession();

  if (!session.isAuthenticated) {
    setFeedback("Votre session n'est plus disponible. Redirection vers la connexion.", "error");
    window.location.replace("/login");
    return;
  }

  sessionEmail.textContent = session.user?.email ?? "-";
  sessionState.textContent = "Connecte";
  setFeedback("Session active.", "success");
}

logoutButton.addEventListener("click", async () => {
  await window.authClient.logout();
  setFeedback("Déconnexion réussie. Redirection vers la connexion.", "success");
  window.location.replace("/login");
});

initializeAccountPage();
