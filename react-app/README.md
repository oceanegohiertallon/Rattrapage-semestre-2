# Planning MATRiCE — application React (F1 + F2 + F3)

Une seule application React + Vite :
- le planning de la semaine, avec des filtres (groupe, domaine, recherche) ;
- une carte par séance ;
- le détail dans une fenêtre (modale), où l'on peut changer le statut.

## Commandes

```bash
npm ci                 # installation
npm run dev            # lancement : http://localhost:5173
npm test               # 13 tests
npm run build          # version de production
npm run contrast       # vérifie les contrastes de couleurs
npm run captures       # refait les captures d'écran (lancer d'abord : npm run build && npm run preview)
```

## Où sont les preuves

**F1 — React avancé**
- Le chargement des séances : `src/api/loadSessions.js`.
- L'état, les filtres et la gestion du désordre : `src/hooks/useSessions.js`.
- Les scénarios dans le navigateur : `?scenario=erreur` et `?scenario=desordre`.
- Les explications : [`JUSTIFICATIONS.md`](../JUSTIFICATIONS.md#f1--react-avancé).

**F2 — Tests**
- Les tests : `src/App.test.jsx` et `src/hooks/useSessions.test.js`.
- La preuve rouge puis vert : `preuves/tests-ROUGE-avant-correction.txt` et `preuves/tests-VERT-apres-correction.txt`.
- Le tableau des scénarios : [`JUSTIFICATIONS.md`](../JUSTIFICATIONS.md#f2--tests-front).

**F3 — Interface et accessibilité**
- Les composants (Tailwind CSS) : `src/components/`.
- Les captures à 360 px et 1280 px : `preuves/capture-*.png`.
- Le protocole clavier et les contrastes : `preuves/protocole-clavier-contraste.md`.
- Les 3 décisions : [`JUSTIFICATIONS.md`](../JUSTIFICATIONS.md#f3--bibliothèques-ui).
