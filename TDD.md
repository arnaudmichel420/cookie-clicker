# TDD - Authentification utilisateur

## User stories

- L'utilisateur souhaite pouvoir se creer un compte et se connecter ensuite.
- L'utilisateur souhaite pouvoir se deconnecter.
- L'utilisateur souhaite pouvoir rester connecte lorsqu'il quitte la page.
- L'utilisateur souhaite etre invite a se connecter lorsqu'il arrive sur le site.

## Criteres d'acceptation

- L'utilisateur peut creer un compte, se connecter et se deconnecter.
- On ne peut pas creer deux comptes avec la meme adresse email.
- Au refresh de la page, l'utilisateur reste connecte.

## Tests E2E

### E2E 1 - Creation de compte puis connexion

Given : un utilisateur arrive sur le site  
When : il cree un compte puis se connecte avec ses identifiants  
Then : l'utilisateur recoit un token et accede a l'application

### E2E 2 - Deconnexion

Given : un utilisateur est connecte  
When : il clique sur se deconnecter  
Then : son token est retire et il est invite a se reconnecter

### E2E 3 - Persistance de connexion au refresh

Given : un utilisateur est connecte avec un token valide  
When : il rafraichit la page  
Then : il reste connecte et accede toujours a l'application

### E2E 4 - Acces au site sans connexion

Given : un utilisateur arrive sur le site sans etre connecte  
When : la page se charge  
Then : il est invite a se connecter

### E2E 5 - Refus de creation de compte avec email deja utilise

Given : un compte existe deja avec une adresse email donnee  
When : un utilisateur tente de creer un deuxieme compte avec la meme adresse email  
Then : le message "Adresse email déjà utilisé" est affiche


# TDD - Cookie qui click

## User stories

- L'utilisateur est connecté et clique sur le cookie, le compteur de cookies s'incrémente à chaque clic, le personnage est animé
- L'utilisateur connecté voit son nombre de cookies et les cookies générés par seconde

## Criteres d'acceptation

- Un clic égale un cookie dans le compteur
- Le compteur s'incrémente
- Au rechargement de la page, le compteur est rechargé avec les statistiques stockées en base

## Tests E2E

### E2E 1 - Clic sur le cookie

Given : un utilisateur est connecte et arrive sur la page du jeu avec 0 cookie  
When : il clique une fois sur le cookie central  
Then : le compteur affiche 1 cookie

### E2E 2 - Incrementation du compteur a chaque clic

Given : un utilisateur est connecte et arrive sur la page du jeu avec 0 cookie  
When : il clique plusieurs fois sur le cookie central  
Then : le compteur s'incremente de 1 cookie a chaque clic

### E2E 3 - Animation du personnage au clic

Given : un utilisateur est connecte et arrive sur la page du jeu  
When : il clique sur le cookie central  
Then : le personnage joue son animation de clic

### E2E 4 - Affichage des statistiques du joueur

Given : un utilisateur est connecte et possede des statistiques de progression  
When : il arrive sur la page du jeu  
Then : son nombre de cookies et les cookies generes par seconde sont affiches

### E2E 5 - Persistance du compteur au rechargement

Given : un utilisateur connecte a gagne des cookies en cliquant sur le cookie  
When : il recharge la page du jeu  
Then : le compteur est recharge avec les statistiques stockees en base


# TDD - Upgrades

## User stories

- L'utilisateur est connecté et clique sur le cookie, avec l'argent récolté il peut acheter des upgrades
- L'utilisateur voit le compteur du clicker être modifié en fonction de l'upgrade qu'il a acheté.

## Criteres d'acceptation

- Un upgrade peut être acheté uniquement si les fonds nécessaires sont fournis
- Si un upgrade est acheté, alors le prix d'achat est soustrait
- Au rechargement de la page, l'upgrade acheté reste actif

## Tests E2E

### E2E 1 - Achat d'une upgrade avec fonds suffisants

Given : un utilisateur est connecté et possède suffisamment de cookies pour acheter une upgrade  
When : il clique sur l'upgrade disponible  
Then : l'upgrade est achetée, le prix est soustrait du compteur, et l'effet de l'upgrade est appliqué

### E2E 2 - Achat d'une upgrade sans fonds suffisants

Given : un utilisateur est connecté et ne possède pas assez de cookies pour acheter une upgrade  
When : il tente de cliquer sur l'upgrade  
Then : l'upgrade n'est pas achetée et un message d'erreur est affiché

### E2E 3 - Persistance des upgrades achetées

Given : un utilisateur est connecté et a acheté une upgrade  
When : il recharge la page du jeu  
Then : l'upgrade achetée reste active et ses effets sont appliqués
