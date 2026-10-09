-- =============================================================================
-- B1 — Démonstration des 5 opérations sur le jeu de données du sujet.
-- Tout se passe dans une transaction annulée à la fin : rejouable à l'identique.
-- Lance : psql -X -f sql/06-demo-operations.sql   (après ./scripts/init.sh)
-- =============================================================================
\set QUIET on
SET search_path = matrice;
SET timezone = 'Europe/Paris';
BEGIN;

\echo '=== 1. Créer une séance : s07, mercredi 21/10 matin, groupe A, sans formateur ==='
SELECT id, date, periode, groupe, mode, titre, statut, semaine_debut
FROM creer_seance('s07', '2026-10-21', 'am', 'A', 'DG', 'Tests front', 'web');

\echo '=== 3. Confirmer une affectation : s04 avec t2, puis s07 avec t3 ==='
SELECT id, formateur_id, statut FROM confirmer_affectation('s04', 't2');
SELECT id, formateur_id, statut FROM confirmer_affectation('s07', 't3');

\echo '=== 2a. Lister la semaine du 19/10/2026 ==='
SELECT * FROM planning_semaine('2026-10-19');

\echo '=== 2b. Formateurs de la semaine ==='
SELECT * FROM formateurs_semaine('2026-10-19');

\echo '=== 4. Heures par formateur (séances confirmées, semaine du 19/10) ==='
SELECT * FROM heures_par_formateur('2026-10-19', '2026-10-25');

\echo '=== 5. Acquis validés de la semaine ==='
SELECT * FROM acquis_valides('2026-10-19');

ROLLBACK;
\echo '(transaction annulée : la base est revenue au jeu de données du sujet)'
