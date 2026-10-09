-- =============================================================================
-- B1 — Plans d'exécution des opérations (après sql/04-volume.sql : 10 000 séances)
-- On explique le CORPS des fonctions : une fonction avec « SET search_path »
-- n'est pas « inlinée », son plan n'apparaîtrait que comme « Function Scan ».
-- Commentaires des plans : conception.md § 5.
-- =============================================================================
SET search_path = matrice;
SET timezone = 'Europe/Paris';

\echo '=== 1. Planning d''une semaine (2024-03-04) ==='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY OFF)
SELECT s.date, s.periode, s.groupe, s.id, s.titre, s.statut, f.nom
FROM seances s
LEFT JOIN formateurs f ON f.id = s.formateur_id
WHERE s.semaine_debut = '2024-03-04'
ORDER BY s.date, s.periode, s.groupe;

\echo '=== 2. Formateurs d''une semaine ==='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY OFF)
SELECT f.id, f.nom, count(*), count(*) FILTER (WHERE s.statut = 'confirmed')
FROM seances s
JOIN formateurs f ON f.id = s.formateur_id
WHERE s.semaine_debut = '2024-03-04'
GROUP BY f.id, f.nom;

\echo '=== 3. Confirmer une affectation (UPDATE par clé primaire + contrôle de l''index unique) ==='
BEGIN;
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY OFF)
UPDATE seances SET formateur_id = 't7', statut = 'confirmed' WHERE id = 'v00003';  -- séance DG proposée (v00010 est AUTO : refusée par la contrainte)
ROLLBACK;

\echo '=== 4. Heures par formateur sur un trimestre ==='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY OFF)
SELECT f.id, f.nom, count(s.id), round(coalesce(sum(s.duree_minutes), 0) / 60.0, 1)
FROM formateurs f
LEFT JOIN seances s
       ON s.formateur_id = f.id
      AND s.statut = 'confirmed'
      AND s.date BETWEEN '2024-01-01' AND '2024-03-31'
GROUP BY f.id, f.nom;

\echo '=== 5. Acquis validés d''une semaine ==='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY OFF)
SELECT s.id, s.titre, a.libelle, a.valide_le
FROM acquis a
JOIN seances s ON s.id = a.seance_id
WHERE a.valide
  AND s.semaine_debut = '2024-03-04'
ORDER BY s.date, s.periode, s.id, a.libelle;

\echo '=== 6. Créneaux d''un formateur (index unique réutilisé en lecture) ==='
EXPLAIN (ANALYZE, BUFFERS, COSTS OFF, SUMMARY OFF)
SELECT id, date, periode, titre
FROM seances
WHERE formateur_id = 't7' AND date BETWEEN '2024-01-01' AND '2024-03-31';
