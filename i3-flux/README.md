# I3 — Structuration de flux

Un programme en ligne de commande qui lit un fichier de séances (une séance JSON par ligne). Il vérifie chaque ligne, la remet au bon format et retire les doublons.

## Prérequis

Node.js 20 ou plus. Rien à installer.

## Lancement

```bash
cd i3-flux
node pipeline.js data/seances.ndjson sortie
```

Le programme crée 3 fichiers dans `sortie/` :
- `acceptes.ndjson` : les séances valides, avec leur numéro de ligne d'origine (`source_line`) ;
- `rejets.ndjson` : les lignes refusées, avec leur numéro et la raison (`motif`) ;
- `stats.json` : le nombre de lignes lues, acceptées, rejetées et en doublon.

Il vérifie toujours que **lues = acceptées + rejetées + doublons**.

## Tests

```bash
npm test      # 25 tests
```

Ils couvrent : ligne valide, lignes invalides (12 règles), doublons, JSON malformé, fichier vide. Ils vérifient aussi que le résultat est le même sur n'importe quel fuseau horaire.

## Résultat sur le fichier du sujet

12 lignes lues : **6 acceptées, 4 rejetées, 2 doublons**.

| Lignes | Résultat | Pourquoi |
|---|---|---|
| 1, 2, 3, 5, 6, 11 | acceptées | remises au bon format (dates, « matin », « après-midi », statuts) |
| 4 et 10 | doublons | s01 et s02 existent déjà |
| 7 | rejetée | titre vide |
| 8 | rejetée | le 30 février n'existe pas |
| 9 | rejetée | « soir » n'est pas une période valide |
| 12 | rejetée | JSON coupé |

## Usage de la mémoire

Le fichier est lu **ligne par ligne**, il n'est jamais chargé en entier. Le programme garde seulement en mémoire la ligne en cours, les compteurs et la liste des identifiants déjà acceptés, qui sert à repérer les doublons.

La mémoire dépend donc du nombre d'identifiants différents (environ 100 Mo pour un million), pas de la taille du fichier.

## Choix

- On vérifie la ligne **avant** de chercher les doublons : si la première version d'un id est invalide, la suivante peut être acceptée.
- Une ligne vide au milieu du fichier est comptée et rejetée.
- Les dates sont vérifiées par calcul, pas avec l'horloge de la machine : le fuseau horaire ne change rien.

## Fichiers

- `pipeline.js` : point d'entrée ;
- `src/normalize.js` : vérification d'une ligne ;
- `src/pipeline.js` : lecture, doublons, écriture ;
- `tests/` : les tests ;
- `data/seances.ndjson` : le fichier du sujet ;
- `preuves/` : les résultats obtenus.
