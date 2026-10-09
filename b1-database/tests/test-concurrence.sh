#!/usr/bin/env bash
# =============================================================================
# B1 — Test RÉEL de concurrence : plusieurs connexions PostgreSQL distinctes
# tentent d'affecter le MÊME formateur au MÊME créneau, en même temps.
#
# Prérequis : base initialisée (scripts/init.sh), variables PG* positionnées
#             (PGHOST, PGPORT, PGUSER, PGDATABASE), psql dans le PATH.
# Lance : ./tests/test-concurrence.sh   -> code 0 si la garantie tient
#
# Partie 1 — chevauchement forcé : la session 1 affecte t1, garde sa transaction
#            ouverte 3 s ; la session 2 tente la même chose pendant ce temps.
#            Attendu : la session 2 ATTEND la fin de la session 1, puis échoue (23505).
# Partie 2 — rafale : 3 sessions lancées en même temps sur 3 séances du même
#            créneau. Attendu : exactement 1 succès, 2 refus.
# Partie 3 — contre-exemple : la même course avec un « vérifier puis écrire »
#            applicatif et SANS l'index unique -> double affectation.
# =============================================================================
set -uo pipefail
# messages serveur en anglais (ASCII) et sans NOTICE ; tout argument -c reste en ASCII :
# sous Windows, les arguments de ligne de commande ne sont pas transmis en UTF-8
export PGOPTIONS="-c lc_messages=C -c client_min_messages=warning"
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -At)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT
ECHEC=0
heure() { date +%H:%M:%S.%3N; }
# préfixe chaque ligne non vide par l'heure de lecture (\r retiré : sortie psql sous Windows)
horodater() { while IFS= read -r l; do l=${l%$'\r'}; [ -n "${l// /}" ] && echo "[$(heure)] $l"; done; }

# Remet les séances de test dans leur état initial
"${PSQL[@]}" > /dev/null <<'SQL'
SET search_path = matrice;
DELETE FROM seances WHERE id LIKE 'c%';
SELECT creer_seance('c01', '2026-10-21', 'am', 'A',         'DG', 'Tests front',        'web');
SELECT creer_seance('c02', '2026-10-21', 'am', 'B',         'DG', 'Tests back',         'web');
SELECT creer_seance('c11', '2026-10-22', 'am', 'A',         'DG', 'Accessibilité',      'web');
SELECT creer_seance('c12', '2026-10-22', 'am', 'B',         'DG', 'Sécurité web',       'cyber');
SELECT creer_seance('c13', '2026-10-22', 'am', 'Promotion', 'CE', 'Conférence données', 'data');
SQL
echo "Préparation : séances c01, c02 (21/10 matin) et c11, c12, c13 (22/10 matin), sans formateur."

# -----------------------------------------------------------------------------
echo
echo "=== Partie 1 — deux transactions qui se chevauchent ==="
(
  echo "[$(heure)] session 1 : BEGIN ; confirmer_affectation('c01','t1') ; attente 3 s ; COMMIT"
  "${PSQL[@]}" -c "BEGIN" \
    -c "SELECT 'session 1 : ' || id || ' -> ' || formateur_id || ' (' || statut || '), transaction ouverte' FROM matrice.confirmer_affectation('c01','t1')" \
    -c "SELECT pg_sleep(3)" -c "COMMIT" 2>&1 | horodater
  echo "[$(heure)] session 1 : COMMIT effectué"
) > "$TMP/s1.log" &
sleep 1
(
  echo "[$(heure)] session 2 : BEGIN ; confirmer_affectation('c02','t1')  (même formateur, même créneau)"
  DEBUT=$(date +%s%N)
  "${PSQL[@]}" -c "BEGIN" \
    -c "SELECT 'session 2 : ' || id || ' -> ' || formateur_id FROM matrice.confirmer_affectation('c02','t1')" \
    -c "COMMIT" > "$TMP/s2.out" 2>&1
  CODE=$?
  FIN=$(date +%s%N)
  horodater < "$TMP/s2.out" | grep -E 'ERROR|DETAIL'
  echo "[$(heure)] session 2 : terminée après $(( (FIN - DEBUT) / 1000000 )) ms, code psql $CODE"
  echo "$CODE" > "$TMP/s2.code"
) > "$TMP/s2.log" &
wait
sort "$TMP/s1.log" "$TMP/s2.log"   # chronologie réelle des deux sessions

ETAT=$("${PSQL[@]}" -c "SELECT string_agg(id || '=' || coalesce(formateur_id,'-') || '/' || statut, ', ' ORDER BY id) FROM matrice.seances WHERE id IN ('c01','c02')")
echo "État final : $ETAT"
if [ "$(cat "$TMP/s2.code")" != 0 ] && grep -q 'ux_seances_formateur_creneau' "$TMP/s2.out" \
   && [ "$ETAT" = "c01=t1/confirmed, c02=-/proposed" ]; then
  echo "RÉSULTAT : OK — la session 2 a attendu le COMMIT de la session 1 puis a été refusée (23505)."
else
  echo "RÉSULTAT : ÉCHEC"; ECHEC=1
fi

# -----------------------------------------------------------------------------
echo
echo "=== Partie 2 — rafale : 3 sessions simultanées, t3 sur c11 / c12 / c13 (22/10 matin) ==="
for s in c11 c12 c13; do
  ( "${PSQL[@]}" -c "SELECT pg_sleep(0.5)" \
      -c "SELECT 'OK : ' || id || ' -> t3' FROM matrice.confirmer_affectation('$s','t3')" \
      > "$TMP/r_$s.out" 2>&1; echo $? > "$TMP/r_$s.code" ) &
done
wait
SUCCES=0
for s in c11 c12 c13; do
  if [ "$(cat "$TMP/r_$s.code")" = 0 ]; then SUCCES=$((SUCCES + 1)); echo "  $s : $(grep -v '^$' "$TMP/r_$s.out" | tail -1)"
  else echo "  $s : refusé -> $(grep -o 'ERROR: .*' "$TMP/r_$s.out")"; fi
done
NB=$("${PSQL[@]}" -c "SELECT count(*) FROM matrice.seances WHERE formateur_id = 't3' AND date = '2026-10-22' AND periode = 'am'")
echo "Séances de t3 le 22/10 matin en base : $NB"
if [ "$SUCCES" = 1 ] && [ "$NB" = 1 ]; then echo "RÉSULTAT : OK — exactement 1 affectation sur 3 tentatives simultanées."
else echo "RÉSULTAT : ÉCHEC"; ECHEC=1; fi

# -----------------------------------------------------------------------------
echo
echo "=== Partie 3 — contre-exemple : « vérifier puis écrire » SANS index unique ==="
"${PSQL[@]}" <<'SQL'
DROP SCHEMA IF EXISTS demo_naif CASCADE;
CREATE SCHEMA demo_naif;
CREATE TABLE demo_naif.seances (id text PRIMARY KEY, date date, periode text, formateur_id text);
INSERT INTO demo_naif.seances VALUES ('n1','2026-10-21','am',NULL), ('n2','2026-10-21','am',NULL);
-- logique applicative typique : compter les séances du créneau, puis écrire si 0
CREATE FUNCTION demo_naif.affecter(p_id text, p_formateur text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE deja int;
BEGIN
  SELECT count(*) INTO deja FROM demo_naif.seances s
   WHERE s.formateur_id = p_formateur AND (s.date, s.periode) = (SELECT date, periode FROM demo_naif.seances WHERE id = p_id);
  PERFORM pg_sleep(1);                      -- temps de traitement entre la lecture et l'écriture
  IF deja > 0 THEN RETURN p_id || ' : refusé (déjà occupé)'; END IF;
  UPDATE demo_naif.seances SET formateur_id = p_formateur WHERE id = p_id;
  RETURN p_id || ' : affecté (aucun conflit vu à la lecture)';
END $$;
SQL
for s in n1 n2; do ( "${PSQL[@]}" -c "SELECT demo_naif.affecter('$s','t1')" > "$TMP/n_$s.out" 2>&1 ) & done
wait
cat "$TMP/n_n1.out" "$TMP/n_n2.out" | sed 's/^/  /'
DOUBLE=$("${PSQL[@]}" -c "SELECT count(*) FROM demo_naif.seances WHERE formateur_id = 't1'")
echo "t1 affecté à $DOUBLE séances sur le même créneau -> la vérification applicative ne protège pas."
"${PSQL[@]}" -c "DROP SCHEMA demo_naif CASCADE"
[ "$DOUBLE" = 2 ] || { echo "(le contre-exemple n'a pas reproduit la course cette fois)"; }

# Nettoyage : la base retrouve le jeu de données du sujet
"${PSQL[@]}" -c "DELETE FROM matrice.seances WHERE id LIKE 'c%'"

echo
if [ "$ECHEC" = 0 ]; then echo "TEST DE CONCURRENCE : RÉUSSI"; else echo "TEST DE CONCURRENCE : ÉCHOUÉ"; fi
exit "$ECHEC"
