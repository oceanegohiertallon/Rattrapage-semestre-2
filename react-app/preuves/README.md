# Preuves F1 / F2 / F3

| Fichier | Compétence | Contenu |
|---|---|---|
| `tests-ROUGE-avant-correction.txt` | F2 | sortie Vitest avec deux bugs volontaires : 3 tests rouges |
| `tests-VERT-apres-correction.txt` | F2 | même commande après correction : 13/13 verts |
| `capture-360px.png`, `capture-1280px.png` | F3 | page complète, build de production, Chrome |
| `capture-360px-detail.png`, `capture-1280px-detail.png` | F3 | détail ouvert (modale) |
| `scenario-desordre-B.png`, `scenario-erreur.png` | F1 | scénarios `?scenario=desordre` et `?scenario=erreur` |
| `trace-navigateur.txt` | F1 / F3 | mesures dans Chrome : débordement horizontal, focus, désordre, erreur |
| `protocole-clavier-contraste.md` | F3 | protocole clavier et tableau de contraste |

Les captures et `trace-navigateur.txt` sont régénérables :
1. dans un premier terminal, `npm run build && npm run preview` ;
2. dans un second terminal, `npm run captures`.

Le script `scripts/captures.mjs` pilote avec puppeteer-core le Chrome installé sur la machine. `CHROME_PATH` permet d'indiquer un autre navigateur.

## Preuve F2 — rouge avant / vert après correction

Commande utilisée dans les deux cas : `npx vitest run --reporter=verbose`.

### Bugs volontairement introduits

**Bug 1 — `src/hooks/useSessions.js`**
La garde anti-désordre (`if (requestId !== requestIdRef.current) return`) est commentée.
Conséquence : une réponse en retard (A, lancée avant B mais qui répond après) écrase les données de la requête la plus récente (B) au lieu d'être ignorée.

**Bug 2 — `src/data/sessions.js`**
Dans `isVisibleForGroup`, la condition `|| session.group === 'Promotion'` est retirée.
Conséquence : filtrer sur le groupe A ou B n'affiche plus les séances « Promotion entière », alors que la règle du sujet l'exige.

### Tests rouges

- `useSessions › affiche toujours les données de la dernière requête lancée (B)…` : reçoit A au lieu de B (bug 1).
- `App › le filtre groupe A inclut aussi les séances de la Promotion entière` : « Données et SQL » absente (bug 2).
- `App › combine les filtres groupe + domaine + recherche texte` : « Travail autonome » (Promotion) absente (bug 2).

Les 10 autres tests restent verts : seuls les comportements cassés échouent, il n'y a pas de régression globale.

### Correction

Correction minimale : les deux lignes sont restaurées à l'identique. Après correction : 13/13 verts.

Pour reproduire : commenter l'une de ces lignes, puis lancer `npm test`.
