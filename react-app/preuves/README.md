# Preuve F2 — rouge avant / vert après correction

## Bugs volontairement introduits

**Bug 1 — `src/hooks/useSessions.js`**
La protection anti-désordre réseau (`if (requestId !== requestIdRef.current) return`) a été commentée.
Conséquence : une réponse réseau "en retard" (ex. la requête A, lancée avant B mais qui répond après)
écrase les données de la requête la plus récente (B), au lieu d'être ignorée.

**Bug 2 — `src/data/sessions.js`**
Dans `isVisibleForGroup`, la condition `|| session.group === 'Promotion'` a été retirée.
Conséquence : filtrer sur le groupe A (ou B) n'affiche plus les séances "Promotion entière",
alors que la règle du sujet l'exige.

## Tests impactés (rouge)

Voir `tests-ROUGE-avant-correction.txt` :
- `useSessions - réponses réseau dans le désordre > affiche toujours les données de la dernière requête lancée (B)...` → échoue (reçoit A au lieu de B)
- `App - planning MATRiCE > le filtre groupe A inclut aussi les séances de la Promotion entière` → échoue (séances Promotion absentes)

Les 6 autres tests restent verts : la preuve montre bien que seuls les comportements cassés échouent,
pas une régression globale.

## Correction

Les deux lignes retirées ont été restaurées à l'identique (voir historique git / diff).

## Résultat après correction (vert)

Voir `tests-VERT-apres-correction.txt` : 8/8 tests passent.
