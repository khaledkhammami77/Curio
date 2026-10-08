# curio.

Prototype jouable du Quiz Éducatif, basé sur [le PRD](design/PRD.md) et les écrans du projet Stitch existant.

## Lancer en local

Dans deux terminaux PowerShell, depuis la racine du dépôt :

```powershell
dotnet run --project server --urls http://localhost:5050
```

```powershell
npm --prefix client install
npm --prefix client run dev
```

Ouvre ensuite <http://localhost:5173>. Vite transmet les requêtes `/api` au serveur ASP.NET Core sur le port 5050.

## Tranche livrée

- Sélection d'une tranche d'âge, d'un ou plusieurs thèmes et du nombre de questions.
- Sessions invitées sans répétition à l'intérieur d'une partie.
- Minuterie adaptée au type, à la difficulté et à l'âge; contrôle du délai également côté serveur.
- Feedback pédagogique, score, niveau de performance et trophée Héros à partir de 70 %.
- Historique local facultatif sur l'appareil de l'invité.
- Échantillon de questions pour les quatre tranches d'âge et les sept thèmes du PRD.
- Les réponses correctes restent côté API au démarrage de la partie.

## Limites actuelles

Le catalogue et les sessions sont en mémoire et réinitialisés au redémarrage de l'API. L'historique invité est stocké dans `localStorage`. L'authentification, OAuth, PostgreSQL, les rôles, l'administration, les médias et le catalogue de plus de 1 000 questions ne sont pas encore implémentés. « Nouvelles questions uniquement » reste désactivé tant qu'un compte et un historique serveur ne sont pas disponibles. Ce prototype n'est pas prêt pour une mise en production.