# I3 — Structuration de flux

Module indépendant : pipeline en ligne de commande qui traite un flux NDJSON de séances.
Les étapes s'enchaînent dans cet ordre : lecture, validation, normalisation, déduplication, sortie.

## Prérequis

Node.js 20+. **Aucune dépendance** : pas besoin de `npm install`.

## Lancement

```bash
cd i3-flux
node pipeline.js data/seances.ndjson sortie      # le dossier de sortie est facultatif (défaut : sortie/)
# ou : npm start
```

Sortie console : `{"lus":12,"acceptes":6,"rejets":4,"doublons":2}`.

Fichiers produits :

| Fichier | Contenu |
|---|---|
| `acceptes.ndjson` | une séance normalisée par ligne, avec `source_line` (numéro de ligne d'origine) |
| `rejets.ndjson` | `source_line`, `motif` du rejet et `contenu` brut de la ligne |
| `stats.json` | `lus`, `acceptes`, `rejets`, `doublons` ; invariant `lus = acceptes + rejets + doublons` vérifié à chaque exécution |

## Tests

```bash
npm test          # = node --test : 25 tests
```

| Catégorie | Ce qui est vérifié |
|---|---|
| Valide | normalisation de la date (`DD/MM/YYYY` vers `YYYY-MM-DD`), de la période (`matin`/`am` → `am`, `après-midi`/`apres-midi`/`pm` → `pm`) et du statut (`propose` → `proposed`, `confirme` → `confirmed`) ; années bissextiles |
| Invalide | 12 règles : date inexistante ou au mauvais format, période, groupe, mode, formateur, statut, titre vide, id manquant, AUTO avec formateur, AUTO confirmée, confirmée sans formateur ; ligne JSON qui n'est pas un objet ; une ligne fautive n'interrompt pas les suivantes |
| Doublon | première occurrence valide retenue ; **validation avant déduplication** (une première occurrence invalide ne bloque pas l'id) |
| JSON malformé | rejet avec le contenu brut, la lecture continue |
| Vide | fichier vide (tout à 0, sorties présentes) ; ligne vide au milieu (lue, rejetée) ; CRLF et BOM acceptés |
| Jeu du sujet | 12 lus = 6 + 4 + 2, bonnes lignes acceptées (1, 2, 3, 5, 6, 11) et rejetées (7, 8, 9, 12) |
| Déterminisme | sorties identiques octet pour octet sous trois fuseaux horaires (UTC, Pacific/Kiritimati, America/Los_Angeles) |

## Données

`data/seances.ndjson` reconstitue les deux tableaux du sujet : un objet JSON par ligne, dans l'ordre de 1 à 11. La ligne 12 y est ajoutée telle quelle : `{"id":"bad4","title":"JSON tronqué"`.

Résultat attendu et obtenu :

| Lignes | Issue | Raison |
|---|---|---|
| 1, 2, 3, 5, 6, 11 | acceptées | normalisées (dates `DD/MM/YYYY`, `matin`, `après-midi`, `confirme`, `propose`) |
| 4, 10 | doublons | s01 et s02 déjà acceptées (lignes 1 et 2) |
| 7 | rejet | titre vide |
| 8 | rejet | date inexistante (30 février) |
| 9 | rejet | période « soir » |
| 12 | rejet | JSON malformé |

## Usage mémoire

Le fichier est lu **en flux, ligne par ligne** (`readline`) : il n'est jamais chargé en entier.

Restent en mémoire :
- la ligne courante ;
- les quatre compteurs ;
- l'ensemble des **id déjà acceptés**, indispensable pour détecter les doublons.

La mémoire croît donc avec le nombre d'id distincts acceptés (quelques dizaines d'octets par id, environ 100 Mo pour un million), et **pas** avec la taille du fichier. Les sorties sont écrites au fil de l'eau, en respectant la contre-pression des flux d'écriture (`drain`).

Au-delà de plusieurs dizaines de millions d'id distincts, l'ensemble ne tiendrait plus en mémoire. Il faudrait alors dédupliquer par tri externe, ou avec un index sur disque (SQLite par exemple).

## Choix d'interprétation

- Une **ligne vide** au milieu du fichier est comptée comme lue, puis rejetée (motif « ligne vide »), pour respecter l'invariant. Le saut de ligne final du fichier ne compte pas comme une ligne.
- **Aucune dépendance au fuseau horaire.** Les dates sont validées par calcul (mois, années bissextiles), jamais par `new Date(texte)`. Rien n'est horodaté dans les sorties, et l'ordre des clés est fixe.
- Un **champ `teacherId` absent** est traité comme `null`.
- Le **domaine** doit être une chaîne non vide ; le sujet n'en fixe pas la liste.

## Structure

```
i3-flux/
├── pipeline.js          point d'entrée CLI
├── src/normalize.js     validation + normalisation d'une ligne (fonction pure)
├── src/pipeline.js      lecture en flux, déduplication, écriture, statistiques
├── tests/pipeline.test.js
├── data/seances.ndjson  jeu de données du sujet
└── preuves/             trace des tests, trace d'exécution, sorties sur le jeu du sujet
```
