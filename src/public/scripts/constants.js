window.AUTH_ROUTES = {
  account: "/account",
  game: "/",
  login: "/login"
};

window.AUTH_MESSAGES = {
  accountActive: "Session active.",
  accountExpired: "Votre session n'est plus disponible. Redirection vers la connexion.",
  loginDefault: "Connectez-vous pour retrouver votre session.",
  loginError: "Connexion impossible.",
  loginSuccess: "Connexion réussie. Redirection en cours.",
  registerDefault: "Créez votre compte puis connectez-vous.",
  registerError: "Impossible de créer le compte.",
  registerMismatch: "Les mots de passe ne correspondent pas.",
  registerSuccess: "Compte créé. Redirection vers la connexion.",
  sessionExpired: "Votre session a expiré. Connectez-vous à nouveau.",
  sessionLoggedOut: "Connectez-vous ou créez un compte pour démarrer.",
  sessionRestored: "Session restaurée avec succès.",
  logoutSuccess: "Déconnexion réussie. Redirection vers la connexion."
};

window.GAME_ROUTES = {
  click: "/game/click",
  state: "/game/state",
  upgrade: "/game/upgrades"
};

window.GAME_MESSAGES = {
  clickError: "Clic refusé.",
  missingSession: "Connectez-vous pour jouer.",
  purchaseError: "Achat refusé.",
  sessionExpired: "Session expirée.",
  upgradePurchased: "Upgrade acheté."
};

window.SOUND_EFFECTS = {
  background: "/sounds/usa-anthem.mp3",
  click: [
    "/sounds/click/ksjsbwuil-cash-register-1-513922.mp3",
    "/sounds/click/dragon-studio-cash-register-kaching-376867.mp3"
  ],
  upgrade: [
    "/sounds/upgrades/donald-trump-approves-this.mp3",
    "/sounds/upgrades/donald-trump-bing-bong-sound-effect_lTRFmBB.mp3",
    "/sounds/upgrades/donald-trump-fake-news-sound-effect.mp3",
    "/sounds/upgrades/i-am-the-chosen-one.mp3",
    "/sounds/upgrades/i_will_build_a_great_great_wall_on_our_southern_bo.mp3",
    "/sounds/upgrades/in-springfield-theyre-eating-the-dogs.mp3",
    "/sounds/upgrades/thank-you-very-much-trump.mp3",
    "/sounds/upgrades/trump-dont-be-rude.mp3",
    "/sounds/upgrades/trump-hates-mosquitoes-audiotrimmer.mp3",
    "/sounds/upgrades/trump-mr-toughguy.mp3"
  ]
};
