-- =============================================================================
-- B1 — Volume réaliste pour les plans d'exécution : 10 000 séances (hypothèse du
-- sujet), 50 formateurs fictifs, ~30 000 acquis. Génération DÉTERMINISTE (pas de
-- random()) : mêmes données, mêmes plans à chaque exécution.
-- Toutes les lignes passent par les contraintes du schéma (aucune désactivée).
-- =============================================================================
SET search_path = matrice;

INSERT INTO formateurs (id, nom)
SELECT 't' || n, 'Formateur fictif ' || n
FROM generate_series(4, 50) AS n;

-- 334 semaines à partir du lundi 7 janvier 2019 (avant la semaine du sujet)
INSERT INTO semaines (debut, libelle)
SELECT d::date, 'Semaine du ' || to_char(d, 'DD/MM/YYYY')
FROM generate_series('2019-01-07'::date, '2019-01-07'::date + 333 * 7, interval '7 days') AS d;

-- 5 jours × 2 demi-journées × 3 groupes par semaine = 30 séances / semaine
WITH creneaux AS (
  SELECT row_number() OVER (ORDER BY w, d, p, g) AS i,
         ('2019-01-07'::date + w * 7 + d) AS jour,
         (ARRAY['am', 'pm'])[p + 1] AS periode,
         (ARRAY['A', 'B', 'Promotion'])[g + 1] AS groupe,
         (w * 10 + d * 2 + p) AS k,      -- numéro du créneau
         g
  FROM generate_series(0, 333) AS w,
       generate_series(0, 4) AS d,
       generate_series(0, 1) AS p,
       generate_series(0, 2) AS g
)
INSERT INTO seances (id, date, periode, groupe, mode, titre, domaine, formateur_id, statut)
SELECT 'v' || lpad(i::text, 5, '0'),
       jour, periode, groupe,
       CASE WHEN i % 10 = 0 THEN 'AUTO' WHEN g = 2 THEN 'CE' ELSE 'DG' END,
       'Séance générée ' || i,
       (ARRAY['web', 'data', 'cyber', 'ia', 'design', 'projet'])[i % 6 + 1],
       -- dans un même créneau, les 3 groupes ont 3 formateurs différents : l'index unique est respecté
       CASE WHEN i % 10 = 0 THEN NULL ELSE 't' || ((k * 3 + g) % 50 + 1) END,
       CASE WHEN i % 10 = 0 OR i % 3 = 0 THEN 'proposed' ELSE 'confirmed' END
FROM creneaux
WHERE i <= 10000;

-- 3 acquis par séance, 2 sur 5 validés environ
INSERT INTO acquis (seance_id, libelle, valide, valide_le)
SELECT s.id,
       'Acquis ' || n,
       abs(hashtext(s.id || n)) % 5 IN (0, 1),
       CASE WHEN abs(hashtext(s.id || n)) % 5 IN (0, 1) THEN s.date + time '12:00' END
FROM seances s, generate_series(1, 3) AS n
WHERE s.id LIKE 'v%';

VACUUM ANALYZE;  -- statistiques à jour + carte de visibilité (index-only scans réels)

SELECT (SELECT count(*) FROM seances)   AS seances,
       (SELECT count(*) FROM formateurs) AS formateurs,
       (SELECT count(*) FROM semaines)   AS semaines,
       (SELECT count(*) FROM acquis)     AS acquis,
       (SELECT count(*) FROM acquis WHERE valide) AS acquis_valides;
