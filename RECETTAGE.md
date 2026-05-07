# RECETTAGE

## Informations Generales

- Projet :
- Version / branche testee :
- Date de recettage :
- Participants :
- Environnement de test :

## Mode D'Emploi

Ce document est un template de recettage a completer pendant la validation.

Pour chaque scenario :

- cocher `OK` si le comportement est conforme
- cocher `KO` si le comportement n'est pas conforme
- cocher `NA` si le scenario ne s'applique pas
- noter les observations dans la colonne commentaire

---

## Scenarios De Test

| ID | Type | Scenario | Resultat attendu | OK | KO | NA | Commentaire |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RCT-01 | Cas normal | Creation de compte | L'utilisateur peut creer un compte valide | [ ] | [ ] | [ ] |  |
| RCT-02 | Cas normal | Connexion utilisateur | L'utilisateur peut se connecter avec ses identifiants | [ ] | [ ] | [ ] |  |
| RCT-03 | Cas normal | Deconnexion | L'utilisateur peut se deconnecter proprement | [ ] | [ ] | [ ] |  |
| RCT-04 | Cas normal | Persistance de connexion | L'utilisateur reste connecte apres refresh si son token est valide | [ ] | [ ] | [ ] |  |
| RCT-05 | Cas normal | Acces au jeu apres connexion | L'utilisateur connecte accede au jeu | [ ] | [ ] | [ ] |  |
| RCT-06 | Cas normal | Clic sur le personnage | Un clic incremente le compteur | [ ] | [ ] | [ ] |  |
| RCT-07 | Cas normal | Clics multiples | Le compteur augmente a chaque clic valide | [ ] | [ ] | [ ] |  |
| RCT-08 | Cas normal | Affichage des statistiques | Les cookies, cookies par seconde et cookies par clic sont affiches | [ ] | [ ] | [ ] |  |
| RCT-09 | Cas normal | Achat d'une upgrade auto-click | L'achat est possible si les fonds sont suffisants et l'effet est applique | [ ] | [ ] | [ ] |  |
| RCT-10 | Cas normal | Achat d'une upgrade boost de clic | L'achat est possible si les fonds sont suffisants et l'effet est applique | [ ] | [ ] | [ ] |  |
| RCT-11 | Cas normal | Evolution du prix d'une upgrade | Le prix augmente apres chaque achat | [ ] | [ ] | [ ] |  |
| RCT-12 | Cas normal | Persistance des upgrades | Les upgrades restent actives apres rechargement | [ ] | [ ] | [ ] |  |
| RCT-13 | Cas normal | Persistance du compteur | Les statistiques sont rechargees depuis la sauvegarde | [ ] | [ ] | [ ] |  |
| RCT-14 | Cas normal | Filtre upgrades auto-click | Le filtre n'affiche que les upgrades auto-click | [ ] | [ ] | [ ] |  |
| RCT-15 | Cas normal | Filtre upgrades boost de clic | Le filtre n'affiche que les upgrades de boost de clic | [ ] | [ ] | [ ] |  |
| RCT-16 | Cas normal | Ouverture / fermeture de la boutique | Le panneau boutique s'ouvre et se ferme correctement | [ ] | [ ] | [ ] |  |
| RCT-17 | Cas normal | Effet billet au clic | Un billet tombe a chaque clic valide | [ ] | [ ] | [ ] |  |
| RCT-18 | Cas normal | Effet pluie de drapeaux | Une pluie de drapeaux se declenche apres la sequence de clics prevue | [ ] | [ ] | [ ] |  |
| RCT-19 | Cas normal | Effet missile | Le missile est declenche au seuil prevu | [ ] | [ ] | [ ] |  |
| RCT-20 | Cas normal | Effet avion de chasse | L'avion est declenche au seuil prevu | [ ] | [ ] | [ ] |  |
| RCT-21 | Cas normal | Feux d'artifice a l'achat | Un effet de feu d'artifice est joue a l'achat d'une upgrade | [ ] | [ ] | [ ] |  |
| RCT-22 | Cas normal | Son au clic | Un son est joue lors d'un clic valide | [ ] | [ ] | [ ] |  |
| RCT-23 | Cas normal | Son a l'achat d'une upgrade | Un son est joue a l'achat d'une upgrade | [ ] | [ ] | [ ] |  |
| RCT-24 | Cas d'erreur | Email deja utilise | La creation de compte est refusee si l'email existe deja | [ ] | [ ] | [ ] |  |
| RCT-25 | Cas d'erreur | Acces non authentifie | Un utilisateur non connecte ne peut pas acceder au jeu | [ ] | [ ] | [ ] |  |
| RCT-26 | Cas d'erreur | Achat sans fonds suffisants | L'upgrade n'est pas achetee et un message d'erreur est affiche | [ ] | [ ] | [ ] |  |
| RCT-27 | Cas d'erreur | Limite de clics depassee | Le clic excedentaire est refuse avec le message prevu | [ ] | [ ] | [ ] |  |
| RCT-28 | Cas d'erreur | Token invalide ou expire | L'utilisateur est invite a se reconnecter | [ ] | [ ] | [ ] |  |
| RCT-29 | Cas limite | Clics rapides sur une courte duree | Le jeu reste stable lors d'un spam de clics | [ ] | [ ] | [ ] |  |
| RCT-30 | Cas limite | Achats rapides successifs | Les prix et les effets restent coherents sur plusieurs achats rapides | [ ] | [ ] | [ ] |  |
| RCT-31 | Cas limite | Rechargements consecutifs | Les donnees restent coherentes apres plusieurs refresh | [ ] | [ ] | [ ] |  |
| RCT-32 | Cas limite | Valeurs elevees de cookies | L'affichage reste lisible pour de gros montants | [ ] | [ ] | [ ] |  |
| RCT-33 | Cas limite | Boutique fermee au chargement | Le panneau est ferme par defaut et reste ouvrable | [ ] | [ ] | [ ] |  |
| RCT-34 | Cas limite | Scroll de la boutique | Le scroll est limite au panneau boutique selon le comportement attendu | [ ] | [ ] | [ ] |  |

---

## Resultats

### Bilan Quantitatif

- Nombre de scenarios testes :
- Nombre de scenarios valides :
- Nombre de scenarios refuses :
- Nombre de scenarios non applicables :

### Bilan Qualitatif

- Points conformes :
- Points a corriger :
- Risques identifies :

---

## Anomalies

### Liste Des Anomalies Relevees

| ID | Description | Gravite | Statut | Commentaire |
| --- | --- | --- | --- | --- |
| ANO-01 |  |  |  |  |
| ANO-02 |  |  |  |  |
| ANO-03 |  |  |  |  |

### Legende De Gravite

- Bloquante
- Majeure
- Mineure

---

## Conclusion

- Decision finale :
  - [ ] Recette validee
  - [ ] Recette validee avec reserves
  - [ ] Recette refusee

- Conclusion generale :

- Actions a prevoir :

- Signature / validation :

