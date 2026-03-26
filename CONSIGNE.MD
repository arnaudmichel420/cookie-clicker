# Cookie Clicker
 
> Note : /20
 
---
 
## Consignes
 
Vous devez développer un jeu de type **Cookie Clicker** en JavaScript.
 
### Stack recommandée
- Node.js (obligatoire)
- Express + EJS (recommandé)
- OU framework moderne (Next.js / Nuxt)
 
---
 
## Fonctionnalités principales
 
### 🍪 Cookie principal (3 pts)
 
- Un gros cookie visible au centre de l’écran
- Le cookie doit être cliquable
- Chaque clic rapporte des cookies
- Une zone doit afficher les statistiques :
  - nombre de cookies actuel etc..
 
---
 
## Système d’améliorations (3,5 pts)
 
Vous devez implémenter un système d’upgrades.
 
### Types d’améliorations :
 
#### 1. Amélioration de clic
- Chaque clic rapporte plus de cookies
- Chaque niveau ajoute **+1 cookie par clic**
- Effet cumulatif
 
#### 2. Auto-clicker
- Génère automatiquement des cookies
- Deux axes d’amélioration :
  - nombre d’auto-clickers
  - vitesse (intervalle de clic)
 
#### 3. Et plus si affinité
  - A vous de voir ;)
 
---
 
### Règles des améliorations
 
- Chaque amélioration a plusieurs niveaux
- Plus le niveau est élevé :
  - plus le coût augmente
  - plus le gain est important
- Les améliorations sont cumulables
 
---
 
## Système utilisateur (2,5 pts)
 
- Mise en place d’un système de compte utilisateur
- Persistance des données avec **SQLite**
- Sauvegarde de la progression (cookies, améliorations…)
 
---
 
## Performance (1 pt)
 
- L’application doit être fluide
- Aucun ralentissement visible
- Expérience utilisateur propre
 
---
 
## Qualité du projet
 
Vous devez produire les fichiers suivants :
 
- `PROJECT.md` (1 pt)
- `TDD.md` (1 pt)
- `RECETTAGE.md` (0.5 pt)
- `GUIDELINES.md` (0.5 pt)
 
---
 
## Tests et CI
 
- Configuration d’une CI (2 pt)
- Tests unitaires (2,5 pts)
- Tests E2E Auto (2,5 pts)
 
Les tests doivent couvrir :
- la logique métier
- les améliorations
- les interactions utilisateur
 
---
 
## Bonus
 
- Sound design (1 pt bonus)
- Interface utilisateur soignée (1 pt bonus)
 
---
 
## Rendu
 
- Repository accessible
- Projet fonctionnel dès le clone
- Commandes disponibles :
  ```bash
  npm install
  npm run start
  npm run lint
  npm test
  npm run test:e2e