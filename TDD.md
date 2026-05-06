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

---

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
