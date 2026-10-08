# PRD — Quiz Éducatif

**Nom du projet :** Quiz Éducatif  
**Version :** 1.0  
**Date :** 4 octobre 2026  
**Auteur :** Khaled Hammami  
**Statut :** Spécification initiale

## 1. Vue d’ensemble

### 1.1 Objectif

Créer une plateforme web de jeu éducatif qui permet aux utilisateurs de tester et d’améliorer leurs connaissances générales en jouant à des quiz interactifs. Le produit doit être utilisable partout, pour le loisir et l’apprentissage, sans exigence liée à un établissement scolaire ou à une localisation.

### 1.2 Public cible

- Enfants de moins de 6 ans
- Enfants de 6 à 12 ans
- Adolescents de 13 à 16 ans
- Utilisateurs de plus de 16 ans

Les questions sont adaptées à la tranche d’âge et présentent un niveau de difficulté facile ou moyen.

### 1.3 Proposition de valeur

- Apprendre en s’amusant avec des questions adaptées à l’âge
- Recevoir immédiatement la bonne réponse et une explication éducative
- Choisir les thèmes souhaités avant chaque session
- Progresser grâce à l’historique et aux trophées pour les utilisateurs avec compte
- Rester accessible aux invités sans obligation de créer un profil

## 2. Fonctionnement du produit

1. L’utilisateur crée un compte, se connecte via OAuth ou joue en invité.
2. Il choisit sa tranche d’âge, un ou plusieurs thèmes et le nombre de questions.
3. Il peut choisir de sauvegarder la session et de demander uniquement des questions jamais vues.
4. Le système sélectionne des questions aléatoires compatibles avec les critères, sans répétition dans la même session.
5. Les questions sont présentées une à une, avec une minuterie adaptée.
6. Après chaque réponse, le système indique si elle est correcte et affiche la bonne réponse avec une explication.
7. À la fin, l’utilisateur reçoit son score, un résumé et le trophée « Héros » s’il atteint au moins 70 %.

## 3. Thèmes initiaux

- Histoire du Canada
- Géographie du Canada
- Géographie du monde
- Sciences
- Mathématiques
- Astronomie
- Religion

Le lancement vise plus de 1 000 questions. L’administrateur ajoute les questions après le déploiement; un échantillon initial de questions doit néanmoins être fourni avec l’application.

## 4. Rôles utilisateurs

| Rôle | Permissions |
|---|---|
| Admin | Gérer les utilisateurs, les rôles, les thèmes, les questions, les médias et les statistiques globales |
| Creator | Créer et modifier les questions autorisées, consulter les statistiques pertinentes |
| User | Jouer, consulter son profil, son historique et ses trophées |
| Invité | Jouer sans compte; sauvegarde locale uniquement si l’option est choisie |

## 5. Exigences fonctionnelles

### F1 — Authentification

- Inscription par email et mot de passe
- Connexion via OAuth : Google, Microsoft, Facebook et Apple
- Mode invité sans création de compte
- Création automatique du rôle `user` pour un nouvel utilisateur
- Profil contenant au minimum le nom, l’email et la tranche d’âge
- Consentement explicite à la politique de confidentialité lors de l’inscription

### F2 — Configuration d’une session

L’utilisateur peut sélectionner :

- Une tranche d’âge : `<6`, `6-12`, `13-16`, `>16`
- Un ou plusieurs thèmes
- Le nombre de questions
- L’option « Sauvegarder cette session dans mon historique »
- L’option « Nouvelles questions uniquement »

L’option « nouvelles questions uniquement » exclut les questions déjà répondues dans l’historique de l’utilisateur connecté. Si le nombre de nouvelles questions disponibles est insuffisant, l’interface doit avertir l’utilisateur et lui proposer de réduire le nombre demandé ou d’autoriser les répétitions entre différentes sessions.

### F3 — Types de questions

Les types pris en charge sont :

- QCM : de 2 à 4 choix avec une seule réponse correcte
- Vrai/Faux : deux choix, avec une seule réponse correcte

Chaque question comporte :

- Le texte de la question
- Le thème
- La tranche d’âge
- La difficulté : facile ou moyenne
- Le type de question
- Les options, si applicable
- La réponse correcte
- Une explication pédagogique
- Un média optionnel

### F4 — Médias

Les questions peuvent inclure :

- Image : JPG, JPEG, PNG, WebP, GIF, SVG si compatible et sécurisé
- Audio : MP3, WAV, OGG
- Vidéo : lien YouTube intégré

Les fichiers image et audio sont stockés sur Cloudinary. Les vidéos sont hébergées sur YouTube et intégrées par URL validée. La limite maximale est de 10 MB par fichier envoyé.

Les médias doivent être accompagnés d’informations accessibles : texte alternatif pour les images, transcription pour l’audio lorsque possible et sous-titres ou alternative textuelle pour les vidéos.

### F5 — Sélection aléatoire des questions

- Les questions sont filtrées selon les thèmes et la tranche d’âge choisis.
- La sélection est aléatoire.
- Une question ne peut pas apparaître deux fois dans la même session.
- Si « nouvelles questions uniquement » est activé, les questions déjà répondues par l’utilisateur sont exclues.
- Le niveau peut s’adapter pendant la session : après trois bonnes réponses consécutives, le système peut privilégier les questions moyennes; après deux mauvaises réponses consécutives, il peut revenir vers les questions faciles.

### F6 — Minuterie adaptative

La minuterie est calculée pour chaque question.

| Élément | Ajustement |
|---|---:|
| Vrai/Faux | 15 secondes de base |
| QCM | 30 secondes de base |
| Difficulté moyenne | +10 secondes |
| Tranche `<6` | +20 secondes |
| Tranche `6-12` | +10 secondes |
| Image | +10 secondes |
| Audio | +15 secondes |
| Vidéo | +20 secondes |

Le temps total est plafonné à 120 secondes. Lorsqu’il expire, la réponse est considérée comme non fournie ou incorrecte; la bonne réponse et l’explication restent affichées, car l’objectif est éducatif.

### F7 — Feedback et résultats

Après chaque question, le site affiche :

- Si la réponse est correcte ou incorrecte
- La bonne réponse
- Une explication éducative
- Un bouton pour passer à la question suivante

À la fin d’une session, le site affiche :

- Le total de questions
- Le nombre de bonnes réponses
- Le pourcentage de réussite
- Le temps moyen par question, si disponible
- Un niveau de performance
- Le trophée « Héros » si le score est supérieur ou égal à 70 %

Il n’y a ni pénalité ni bonus de rapidité.

### F8 — Historique et sauvegarde

- Un utilisateur connecté peut choisir de sauvegarder une session dans son historique.
- Si l’option est activée, les questions, réponses, temps et résultats sont stockés dans la base de données.
- Un invité peut sauvegarder l’état de la session localement dans le navigateur afin de reprendre après une interruption.
- Les sessions invitées ne sont pas automatiquement conservées sur le serveur.
- Une session interrompue doit pouvoir être marquée comme `active`, `completed` ou `abandoned`.

### F9 — Administration des questions

Les administrateurs et créateurs autorisés disposent d’une interface permettant de :

- Lister les questions avec recherche, filtres et pagination
- Créer une question
- Modifier une question
- Supprimer une question selon les permissions
- Ajouter, remplacer ou supprimer un média
- Gérer les options QCM
- Prévisualiser une question avant publication
- Valider les champs requis avant enregistrement

### F10 — Statistiques

Le produit doit prévoir :

- Statistiques personnelles : sessions, score moyen, thèmes forts, thèmes à améliorer, trophées
- Statistiques globales pour les administrateurs : utilisateurs, sessions, questions, score moyen
- Base technique pour les futurs classements

## 6. Fonctionnalités futures

### F11 — Classements

- Classement des meilleurs joueurs
- Filtres possibles par thème et tranche d’âge
- Respect du consentement et des préférences de visibilité du profil

### F12 — Multijoueur

- Création de salle
- Code d’invitation
- Questions synchronisées
- Scores et classement en direct
- Annonce du gagnant à la fin

### F13 — API d’intégration

- API REST documentée avec OpenAPI/Swagger
- Authentification par clé API ou OAuth selon le cas
- Limitation de débit
- Endpoints limités et sécurisés pour les intégrations externes

## 7. Architecture technique cible

| Couche | Technologie recommandée |
|---|---|
| Frontend | React + TypeScript + Vite |
| Backend | ASP.NET Core Web API (.NET 8 ou version LTS active) |
| Base de données | PostgreSQL |
| ORM | Entity Framework Core avec Npgsql |
| Authentification | Auth0 ou fournisseur compatible OIDC/OAuth avec email/mot de passe et connexions sociales |
| Images et audio | Cloudinary |
| Vidéo | YouTube intégré |
| Hébergement frontend | Netlify, Vercel ou équivalent à faible coût |
| Hébergement backend | Render, Azure, Railway ou équivalent à faible coût |
| Documentation API | Swagger / OpenAPI |

## 8. Modèle de données

Les principales entités sont :

- `Users` : profil utilisateur et fournisseur d’authentification
- `Roles` : admin, creator, user
- `UserRoles` : relation entre les utilisateurs et les rôles
- `Themes` : catégories de contenu
- `Questions` : énoncé, âge, difficulté, type, réponse et explication
- `QuestionOptions` : options des QCM
- `Sessions` : configuration, état et résultats d’une partie
- `SessionQuestions` : ordre immuable des questions sélectionnées pour une session
- `SessionAnswers` : réponse donnée, exactitude et temps consommé
- `Trophies` : trophées obtenus ou compteurs de trophées
- `MediaAssets` : optionnel, métadonnées Cloudinary et validation des médias

Important : les réponses correctes ne doivent jamais être envoyées au navigateur lorsqu’une session démarre. Elles sont comparées uniquement côté serveur au moment de la soumission de la réponse.

## 9. Logique backend

### 9.1 Démarrage de session

1. Valider les thèmes, la tranche d’âge et les options.
2. Identifier l’utilisateur connecté ou le contexte invité.
3. Rechercher les questions compatibles.
4. Exclure les questions déjà répondues si l’option est activée.
5. Mélanger les questions de manière aléatoire et sûre.
6. Créer une session et enregistrer l’ordre retenu dans `SessionQuestions`.
7. Retourner au client les données nécessaires pour afficher les questions, sans révéler les réponses correctes.

### 9.2 Soumission d’une réponse

1. Vérifier que la session appartient à l’utilisateur ou au jeton invité concerné.
2. Vérifier que la question appartient à la session et n’a pas déjà été répondue.
3. Vérifier la limite de temps côté serveur; le chronomètre côté client est une aide visuelle seulement.
4. Comparer la réponse reçue à la réponse correcte.
5. Enregistrer le résultat et le temps consommé.
6. Retourner le verdict, la bonne réponse et l’explication.

### 9.3 Finalisation

1. Vérifier que toutes les questions sont traitées ou que la session est explicitement terminée.
2. Calculer le score : `bonnes réponses / nombre total de questions * 100`.
3. Déterminer le niveau de performance.
4. Attribuer ou incrémenter le trophée Héros si le score est au moins 70 %.
5. Mettre à jour la session comme terminée.
6. Retourner un résumé final.

## 10. Exigences de sécurité et confidentialité

- HTTPS obligatoire en production
- Authentification via OIDC/OAuth et validation JWT côté API
- Autorisation par rôles côté serveur
- Contrôle de propriété des sessions et profils
- Validation stricte de toutes les entrées côté serveur
- Limitation de débit sur les endpoints sensibles
- Journalisation technique sans exposer de données personnelles inutiles
- CORS limité aux domaines frontend autorisés
- Politique de confidentialité accessible
- Consentement explicite lors de la création de compte
- Possibilité de consulter, corriger et supprimer les données du profil
- Les données de profil incluent notamment email, nom et tranche d’âge; collecter le minimum nécessaire
- Ne pas stocker les mots de passe dans la base applicative lorsque le fournisseur d’identité les gère
- Vérification du type MIME, de la taille, du contenu et de l’extension avant tout téléversement

## 11. Accessibilité

Le site doit viser la conformité WCAG 2.1 niveau AA.

- Contraste texte/fond d’au moins 4.5:1 pour le texte normal
- Navigation complète au clavier
- Indicateur de focus visible
- Structure HTML sémantique et titres hiérarchisés
- Labels explicites pour formulaires et boutons
- Messages d’erreur compréhensibles et associés aux champs
- Compatibilité lecteur d’écran avec ARIA uniquement lorsque nécessaire
- Alternatives textuelles aux images, audio et vidéo
- Le minuteur doit être annoncé sans interruption excessive; les changements critiques doivent être accessibles
- Les interactions ne doivent pas dépendre uniquement de la couleur, du son ou du glisser-déposer

## 12. Endpoints API prévus

### Authentification et profil

- `POST /api/auth/register`
- `GET /api/auth/me`
- `PUT /api/users/me`
- `DELETE /api/users/me`

### Thèmes et questions

- `GET /api/themes`
- `GET /api/questions`
- `GET /api/questions/{id}`
- `POST /api/questions`
- `PUT /api/questions/{id}`
- `DELETE /api/questions/{id}`
- `POST /api/media/upload`

### Sessions

- `POST /api/sessions/start`
- `POST /api/sessions/{sessionId}/answers`
- `POST /api/sessions/{sessionId}/complete`
- `POST /api/sessions/{sessionId}/abandon`
- `GET /api/sessions/my-history`
- `GET /api/sessions/{sessionId}`

### Administration et statistiques

- `GET /api/admin/users`
- `PUT /api/admin/users/{id}/roles`
- `GET /api/stats/global`
- `GET /api/users/me/stats`

## 13. Critères d’acceptation globaux

Le produit est considéré prêt à être lancé lorsque :

- Un invité peut démarrer et terminer une session complète.
- Un utilisateur peut s’inscrire, se connecter, consulter et supprimer son profil.
- Les connexions OAuth configurées fonctionnent de bout en bout.
- Les rôles protègent réellement les fonctionnalités administratives côté API.
- Les questions QCM et Vrai/Faux fonctionnent sans répétition dans une même session.
- Les médias image, audio et vidéo sont affichés correctement et de façon accessible.
- Le chronomètre se comporte correctement et l’expiration affiche la bonne réponse.
- Le score final et le trophée Héros sont calculés correctement.
- L’historique est enregistré seulement lorsque l’utilisateur a choisi cette option.
- Les contrôles WCAG prioritaires sont validés par tests automatisés et manuels.
- L’API est documentée dans Swagger/OpenAPI.

## 14. Métriques de suivi

- Nombre d’utilisateurs inscrits
- Nombre de sessions terminées
- Pourcentage de sessions abandonnées
- Score moyen par thème et tranche d’âge
- Nombre de questions disponibles par thème, âge et difficulté
- Taux d’obtention du trophée Héros
- Temps moyen de chargement et taux d’erreur API
- Résultats des audits d’accessibilité

## 15. Questions de contenu

Les thèmes liés à la religion doivent être rédigés avec neutralité, précision, respect des différentes croyances et sources fiables. Le contenu destiné aux enfants doit être adapté à leur âge, sans stéréotypes ni formulation discriminatoire.

Les images, sons et vidéos doivent être originaux, sous licence compatible, dans le domaine public ou utilisés avec l’autorisation nécessaire.

## 16. Historique des versions

| Version | Date | Auteur | Changements |
|---|---|---|---|
| 1.0 | 4 octobre 2026 | Khaled Hammami | Première version du PRD |
