# B1 — Base de données

Une base PostgreSQL pour MATRiCE : formateurs, semaines, séances et acquis. La règle principale : **un formateur ne peut pas avoir deux séances au même moment**, même si deux personnes l'affectent en même temps.

## Fichiers

| Fichier | Contenu |
|---|---|
| [`conception.md`](conception.md) | explication du modèle, des index, du choix de PostgreSQL, et des plans d'exécution |
| `sql/01-schema.sql` | les tables et toutes les règles |
| `sql/02-donnees.sql` | les données du sujet |
| `sql/03-operations.sql` | les 5 opérations demandées |
| `sql/04-volume.sql`, `sql/05-explain.sql` | 10 000 séances de test et plans d'exécution |
| `sql/06-demo-operations.sql` | démonstration des opérations |
| `tests/` | test de concurrence et test des entrées invalides |
| `preuves/` | les résultats obtenus |

## Lancement

Il faut PostgreSQL 17 (avec Docker, ou installé), `psql` et bash.

```bash
cd b1-database
cp .env.example .env                       # puis changer le mot de passe
docker compose --env-file .env up -d       # démarre PostgreSQL
set -a; . ./.env; set +a                   # donne les infos de connexion à psql

./scripts/init.sh                          # crée les tables et ajoute les données
psql -X -f sql/06-demo-operations.sql      # montre les 5 opérations
```

## Tests

```bash
psql -X -v ON_ERROR_STOP=1 -f tests/test-entrees-invalides.sql   # 18 entrées refusées, 5 acceptées
./tests/test-concurrence.sh                                      # plusieurs connexions en même temps
```

## Plans d'exécution

```bash
./scripts/init.sh --volume                 # ajoute 10 000 séances
psql -X -f sql/05-explain.sql
./scripts/init.sh                          # revient aux données du sujet
```

Les fichiers de `preuves/` ont été produits avec PostgreSQL 17.6, avec ces commandes.
