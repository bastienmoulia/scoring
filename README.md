# Scoring app

Application Ionic + Angular + Firebase pour créer des parties et modifier les scores d'équipes en direct.

## Prérequis

- Node.js 20+
- Un projet Firebase avec Firestore activé

## Configuration Firebase

Renseignez vos clés Firebase dans :

`src/environments/environment.ts`

## Lancer en web

```bash
npm install
npm start
```

## Ajouter les plateformes mobiles

```bash
npm run build
npm run cap:add:android
npm run cap:add:ios
npm run cap:sync
```

Ensuite ouvrez les projets natifs avec Android Studio / Xcode depuis les dossiers `android/` et `ios/`.

## Tests

```bash
npm test -- --watch=false --browsers=ChromeHeadless
```
