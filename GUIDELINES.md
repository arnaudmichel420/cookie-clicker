Ce document doit contenir :

conventions de nommage
organisation du code
règles de style
bonnes pratiques
Tout autre élément pertinent pour assurer la qualité du code peut être ajouté.

# Guidelines

## Conventions de nommage

- Fichiers, dossiers, variables et fonctions : `camelCase` (ex: `cookieCount`)
- Classes : `PascalCase` (ex: `UserController`)
- Constantes : `UPPER_SNAKE_CASE` (ex: `MAX_UPGRADE_LEVEL`)

---

## Structure d'un commit

```

Types autorisés :

| Type | Usage |
|---|---|
| `feature` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |

Exemples :
```
feature: ajout du système d'auto-clicker
fix: correction du calcul de cookies par clic
```

---

## Branches

- `main | dev` — branche protégée, merge uniquement via PR
- `feature/<nom>` — nouvelle fonctionnalité
- `fix/<nom>` — correction de bug

---

## Pull Requests

- Toute PR doit cibler `dev` (jamais `main` directement)
- La CI doit passer avant le merge
- Au moins une relecture requise

---

## Style de code

- Linter : ESLint (config dans `.eslintrc.js`)
- Indentation : 2 espaces
- Guillemets : double `"`
- Point-virgules : obligatoires
- Longueur de ligne max : 100 caractères

Vérification :
```bash
npm run lint
```

---

## Tests

- Tout nouveau comportement métier doit être couvert par un test unitaire
- Les tests E2E couvrent les parcours utilisateur critiques (connexion, clic, achat d'upgrade)
- Un test qui échoue bloque le merge

---

## Variables d'environnement

- Ne jamais commiter de secrets dans le dépôt
- Toute nouvelle variable doit être ajoutée dans `.env.example` avec une valeur fictive