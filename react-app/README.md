# Planning MATRiCE — projet React (F1 + F2 + F3)

Une seule application React + Vite :
- planning de la semaine ;
- filtres groupe / domaine / texte ;
- cartes de séances ;
- détail en modale ;
- modification locale du statut.

Installation, lancement et tests : voir le [README racine](../README.md#projet-react--f1--f2--f3).

```bash
npm ci && npm run dev     # lancer (http://localhost:5173)
npm test                  # 13 tests, non interactif
```

## Où trouver la preuve de chaque compétence

### F1 — React avancé

| Exigence du sujet | Où |
|---|---|
| `loadSessions({ group })` asynchrone, délai artificiel, interchangeable | `src/api/loadSessions.js` ; injecté dans `useSessions(loader)` / `<App loader>` ; variantes dans `src/api/demoScenarios.js` |
| Filtres groupe, domaine, recherche | `src/hooks/useSessions.js` (état + `useMemo`), `src/components/FilterBar.jsx` |
| Chargement / erreur / vide / nouvelle tentative | `src/components/SessionList.jsx` ; dans le navigateur : `?scenario=erreur`, recherche « xyz » |
| A à t=0 (800 ms) puis B à t=100 ms (200 ms) : l'écran reste sur B | garde `requestIdRef` dans `useSessions.js` ; test dans `useSessions.test.js` ; navigateur : `?scenario=desordre` ; mesure : `preuves/trace-navigateur.txt` |
| Statut modifié localement, cohérent entre liste et détail | `statusOverrides` dans `useSessions.js` + détail retrouvé par id dans `App.jsx` |
| Explication état / valeurs calculées / effets / nettoyage / clés | [`JUSTIFICATIONS.md` § F1](../JUSTIFICATIONS.md#f1--react-avancé) |
| Scénario « filtres combinés » | test *combine les filtres groupe + domaine + recherche texte* + procédure manuelle dans JUSTIFICATIONS |

### F2 — Tests front

| Exigence du sujet | Où |
|---|---|
| ≥ 6 tests : chargement, succès, A + Promotion, vide, erreur + nouvelle tentative, désordre | `src/App.test.jsx` (10 tests), `src/hooks/useSessions.test.js` (3 tests) |
| Nom accessible du filtre + clavier | tests *le filtre groupe a un nom accessible…* et *ouvre le détail au clavier…* |
| ≥ 2 tests rouges avant correction, puis verts | `preuves/tests-ROUGE-avant-correction.txt` (3 rouges), puis `preuves/tests-VERT-apres-correction.txt` (13 verts) ; explications dans `preuves/README.md` |
| Tableau scénario / entrée / attente / risque | [`JUSTIFICATIONS.md` § F2](../JUSTIFICATIONS.md#f2--tests-front) |
| Configuration, dépendances verrouillées, commande non interactive | `vite.config.js` (bloc `test`), `src/test/setup.js`, `package-lock.json`, `npm test` = `vitest run` |

### F3 — Bibliothèques UI

| Exigence du sujet | Où |
|---|---|
| Bibliothèque UI | Tailwind CSS v4 (`@tailwindcss/vite`, `src/index.css`) |
| Hiérarchie filtres → cartes → badges → détail | `src/components/*` (`FilterBar`, `SessionList`, `SessionCard`, `StatusBadge`, `DomainBadge`, `SessionDetail`) |
| Clavier, noms accessibles, focus à l'ouverture et à la fermeture | `SessionDetail.jsx` (focus initial, piège `Tab`, `Échap`, retour du focus) |
| Captures réelles 360 px et 1280 px | `preuves/capture-360px*.png`, `preuves/capture-1280px*.png` |
| Protocole clavier + mesure de contraste | `preuves/protocole-clavier-contraste.md`, `npm run contrast` |
| Trois décisions justifiées | [`JUSTIFICATIONS.md` § F3](../JUSTIFICATIONS.md#f3--bibliothèques-ui) |

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | serveur de développement |
| `npm test` | 13 tests Vitest, non interactif |
| `npm run build` / `npm run preview` | build de production / le servir (port 4173) |
| `npm run contrast` | ratios WCAG des couleurs Tailwind utilisées (`scripts/contrast.mjs`) |
| `npm run captures` | avec `preview` lancé : captures 360/1280 px et scénarios F1 dans Chrome (`scripts/captures.mjs`) |
| `npm run lint` | oxlint |
