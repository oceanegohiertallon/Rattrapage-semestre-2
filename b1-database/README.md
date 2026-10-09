# B1 — Base de données

Module indépendant : modélisation PostgreSQL de MATRiCE (formateurs, semaines, séances, acquis),
avec la garantie qu'**un formateur ne peut pas être affecté à deux séances du même créneau, même
sous concurrence**.

| Livrable | Fichier |
|---|---|
| Conception : clés, cardinalités, valeurs autorisées, index, relationnel vs documentaire, plans commentés | [`conception.md`](conception.md) |
| Schéma + validations + index | [`sql/01-schema.sql`](sql/01-schema.sql) |
| Jeu de données du sujet | [`sql/02-donnees.sql`](sql/02-donnees.sql) |
| Opérations (créer, lister semaine + formateurs, confirmer, heures, acquis validés) | [`sql/03-operations.sql`](sql/03-operations.sql) |
| Volume de 10 000 séances / plans d'exécution | [`sql/04-volume.sql`](sql/04-volume.sql), [`sql/05-explain.sql`](sql/05-explain.sql) |
| Démonstration des opérations | [`sql/06-demo-operations.sql`](sql/06-demo-operations.sql) |
| Test réel de concurrence | [`tests/test-concurrence.sh`](tests/test-concurrence.sh) |
| Refus des entrées invalides | [`tests/test-entrees-invalides.sql`](tests/test-entrees-invalides.sql) |
| Résultats produits | [`preuves/`](preuves/) |

## Prérequis

- PostgreSQL 17 : avec Docker (`docker-compose.yml` fourni), ou une installation locale ;
- le client `psql` dans le `PATH` ;
- bash (Git Bash sous Windows) pour les scripts `.sh`.

## Lancement

```bash
cd b1-database
cp .env.example .env                        # puis changer le mot de passe local
docker compose --env-file .env up -d        # PostgreSQL 17 sur le port de .env
set -a; . ./.env; set +a                    # exporte PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE

./scripts/init.sh                           # schéma + données du sujet + opérations
psql -X -f sql/06-demo-operations.sql       # les 5 opérations sur les données du sujet
```

## Tests

```bash
psql -X -v ON_ERROR_STOP=1 -f tests/test-entrees-invalides.sql   # 18 refus + 5 acceptations, code 0 si tout est conforme
./tests/test-concurrence.sh                                      # vraies sessions parallèles, code 0 si la garantie tient
```

## Plans d'exécution

```bash
./scripts/init.sh --volume                  # + 10 000 séances, 50 formateurs, 30 000 acquis
psql -X -f sql/05-explain.sql
./scripts/init.sh                           # revenir au jeu de données du sujet
```

Les fichiers de `preuves/` ont été produits avec PostgreSQL 17.6 (binaires officiels EDB, port local)
par exactement ces commandes ; chacun indique la commande et la date en en-tête.
