# Cookie Clicker

C'est un jeu en ligne où le joueur accumule des cookies au clic. Le joueur, grâce à son compte, a une persistance des cookies accumulés et peut aussi acheter des améliorations pour l'aider dans la collecte.

---

## Fonctionnalités

- Clic sur un cookie central qui incrémente le compteur
- Affichage en temps réel des statistiques (cookies, cookies/sec, cookies/clic)
- Système d'améliorations par niveaux (coût croissant, gain croissant) :
  - Amélioration du clic (+1 cookie par clic par niveau)
  - Auto-clicker (fréquence et nombre configurables)
- Système de compte utilisateur (inscription / connexion)
- Persistance de la progression via SQLite (cookies, améliorations achetées)

---

## Architecture
```
cookie-clicker/
├── src/
│   ├── routes/          # Express routes (auth, game, upgrades)
│   ├── controllers/     # Logique métier découplée des routes
│   ├── models/          # Accès SQLite (users, saves)
│   ├── views/           # Templates EJS
│   └── public/          # Assets statiques (CSS, JS client)
├── tests/
│   ├── unit/            # Tests unitaires (Vitest)
│   └── e2e/             # Tests end-to-end (Playwright)
├── .github/
│   └── workflows/       # Pipeline CI (lint, tests, e2e)
├── PROJECT.md
├── TDD.md
├── RECETTAGE.md
└── GUIDELINES.md
```

---

## Stack technique

| Couche | Technologie |
|---|---|
| Runtime | Node.js |
| Serveur | Express |
| Templates | EJS |
| Base de données | SQLite (better-sqlite3) |
| Tests unitaires | Vitest |
| Tests E2E | Playwright |
| Linter | ESLint |
| CI | GitHub Actions |

---

## Installation
```bash
git https://github.com/arnaudmichel420/cookie-clicker
cd cookie-clicker
npm install
```

Copier `.env.example` en `.env` et renseigner les variables :
```
SESSION_SECRET=...
DB_PATH=./db/game.sqlite
```

---

## Commandes
```bash
npm run build       # Compile le projet pour la production
npm run start       # Lance le serveur en production
npm run dev         # Lance le serveur avec hot-reload
npm run lint        # Vérifie le style du code
npm test            # Lance les tests unitaires
npm run test:e2e    # Lance les tests end-to-end
```

---

## CI

Le pipeline GitHub Actions s'exécute à chaque push et pull request sur `main` :

1. Installation des dépendances
2. Lint
3. Tests unitaires
4. Tests E2E (avec Playwright sur Chromium)

Aucun merge n'est autorisé si l'un de ces steps échoue.