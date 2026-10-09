#!/usr/bin/env bash
# Initialise la base MATRiCE : schéma + jeu de données du sujet + opérations.
#   ./scripts/init.sh            -> données du sujet (6 séances)
#   ./scripts/init.sh --volume   -> + 10 000 séances générées (pour les plans d'exécution)
# Connexion : variables PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE (voir .env.example).
set -euo pipefail
cd "$(dirname "$0")/.."
export PGOPTIONS="${PGOPTIONS:--c client_min_messages=warning}"

FICHIERS=(sql/01-schema.sql sql/02-donnees.sql sql/03-operations.sql)
[ "${1:-}" = "--volume" ] && FICHIERS+=(sql/04-volume.sql)

for f in "${FICHIERS[@]}"; do
  echo "-> $f"
  psql -X -q -v ON_ERROR_STOP=1 -f "$f"
done
echo "Base initialisée."
