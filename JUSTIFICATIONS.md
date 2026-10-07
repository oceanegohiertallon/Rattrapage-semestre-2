# Justifications techniques

## F1 — React avancé

- **Choix :** un seul hook `useSessions` centralise l'état (filtres, chargement, erreur).
  `App.jsx` reste simple, et la logique est testable sans monter toute l'UI.
- **Désordre réseau :** chaque requête a un numéro (`requestIdRef`). Au retour, on ignore
  la réponse si elle n'est plus la dernière demandée. C'est le seul moyen fiable de garantir
  que l'écran reflète toujours le dernier filtre choisi, même si les réponses arrivent dans
  le désordre.
- **Alternative envisagée :** `AbortController` pour annuler vraiment la requête. Pas retenu
  ici car `loadSessions` est une simulation locale (pas un vrai `fetch`), donc rien à annuler
  côté réseau — le filtrage par id suffit et reste simple.
- **Limite :** pas de cache, chaque changement de groupe relance un chargement complet.

## F2 — Tests front

- **Choix :** Vitest + Testing Library. S'intègre nativement à Vite, pas de config séparée.
- **Mock de `loadSessions`** pour contrôler précisément les délais dans le test du désordre
  réseau (impossible à garantir avec de vrais timers aléatoires).
- **Preuve rouge/vert :** voir `react-app/preuves/` — deux bugs volontaires introduits
  (anti-désordre désactivé, règle Promotion cassée), tests rouges capturés, correction,
  tests verts capturés.
- **Limite :** pas de test end-to-end (navigateur réel), tout tourne en jsdom.

## F3 — Bibliothèques UI

- **Hiérarchie carte/détail :** la liste reste volontairement minimale (titre, domaine,
  groupe, formateur, statut) — juste de quoi scanner le planning d'un coup d'œil. Le détail
  complet (date, formateur, actions) n'apparaît que dans la modale, pour ne pas surcharger
  la liste quand on a beaucoup de séances.
- **Lisibilité des statuts :** chaque badge combine icône + texte (pas que la couleur), pour
  rester compréhensible en cas de daltonisme ou d'affichage en niveaux de gris. Contrastes
  vérifiés (WCAG AA, voir `react-app/preuves/protocole-clavier-contraste.md`).
- **Accès aux actions :** la carte entière est un `<button>` (pas juste un lien "voir plus"),
  donc toute la surface est cliquable/focusable. La modale déplace le focus à l'ouverture et
  le restitue à la fermeture, pour ne pas perdre le fil au clavier.
- **Preuves :** captures 360px/1280px + protocole clavier/contraste dans `react-app/preuves/`.
