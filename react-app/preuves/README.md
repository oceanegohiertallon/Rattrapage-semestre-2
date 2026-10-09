# Preuves

| Fichier | Ce qu'il montre |
|---|---|
| `tests-ROUGE-avant-correction.txt` | les tests avec 2 bugs volontaires : 3 tests échouent (F2) |
| `tests-VERT-apres-correction.txt` | les mêmes tests après correction : les 13 passent (F2) |
| `capture-360px.png`, `capture-1280px.png` | la page sur téléphone et sur ordinateur (F3) |
| `capture-360px-detail.png`, `capture-1280px-detail.png` | le détail d'une séance ouvert (F3) |
| `scenario-desordre-B.png`, `scenario-erreur.png` | les cas « désordre » et « erreur » (F1) |
| `trace-navigateur.txt` | mesures faites dans Chrome : débordement, focus, désordre, erreur |
| `protocole-clavier-contraste.md` | navigation au clavier et contrastes (F3) |

Pour refaire les captures : lancer `npm run build && npm run preview`, puis `npm run captures` dans un autre terminal.

## Preuve F2 : rouge puis vert

**Bug 1** (`src/hooks/useSessions.js`) : la ligne qui ignore les anciennes réponses est mise en commentaire. Une ancienne réponse peut alors remplacer la plus récente.

**Bug 2** (`src/data/sessions.js`) : la règle « le groupe A voit aussi la Promotion » est retirée.

**Résultat avec les bugs** : 3 tests échouent.
- le test du désordre (il reçoit A au lieu de B) ;
- le test « A inclut la Promotion » ;
- le test des filtres combinés.

Les 10 autres tests passent toujours.

**Correction** : les deux lignes sont remises. Les 13 tests passent.

Pour le refaire : mettre une de ces lignes en commentaire, puis lancer `npm test`.
