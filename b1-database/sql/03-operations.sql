-- =============================================================================
-- B1 — Opérations demandées, sous forme de fonctions SQL.
-- Les règles restent dans les contraintes du schéma : les fonctions ne font que
-- les écritures, elles ne « vérifient » rien elles-mêmes (sinon course possible).
-- =============================================================================
SET search_path = matrice;

-- 1. Créer une séance ----------------------------------------------------------
-- La semaine est créée au besoin (libellé générique) ; toutes les validations
-- (période, groupe, AUTO, confirmation, créneau du formateur) sont faites par la base.
CREATE OR REPLACE FUNCTION creer_seance(
  p_id text, p_date date, p_periode text, p_groupe text, p_mode text,
  p_titre text, p_domaine text, p_formateur text DEFAULT NULL, p_statut text DEFAULT 'proposed'
) RETURNS seances
LANGUAGE sql
SET search_path = matrice, pg_temp
AS $$
  INSERT INTO semaines (debut, libelle)
  VALUES (p_date - (EXTRACT(ISODOW FROM p_date)::integer - 1),
          'Semaine du ' || to_char(p_date - (EXTRACT(ISODOW FROM p_date)::integer - 1), 'DD/MM/YYYY'))
  ON CONFLICT (debut) DO NOTHING;

  INSERT INTO seances (id, date, periode, groupe, mode, titre, domaine, formateur_id, statut)
  VALUES (p_id, p_date, p_periode, p_groupe, p_mode, p_titre, p_domaine, p_formateur, p_statut)
  RETURNING *;
$$;

-- 2. Lister une semaine et ses formateurs ---------------------------------------
CREATE OR REPLACE FUNCTION planning_semaine(p_lundi date)
RETURNS TABLE (date date, periode text, groupe text, id text, titre text,
               domaine text, mode text, statut text, formateur text)
LANGUAGE sql STABLE
SET search_path = matrice, pg_temp
AS $$
  SELECT s.date, s.periode, s.groupe, s.id, s.titre, s.domaine, s.mode, s.statut,
         coalesce(f.nom, '—')
  FROM seances s
  LEFT JOIN formateurs f ON f.id = s.formateur_id
  WHERE s.semaine_debut = p_lundi
  ORDER BY s.date, s.periode, s.groupe;
$$;

CREATE OR REPLACE FUNCTION formateurs_semaine(p_lundi date)
RETURNS TABLE (id text, nom text, nb_seances bigint, nb_confirmees bigint)
LANGUAGE sql STABLE
SET search_path = matrice, pg_temp
AS $$
  SELECT f.id, f.nom, count(*), count(*) FILTER (WHERE s.statut = 'confirmed')
  FROM seances s
  JOIN formateurs f ON f.id = s.formateur_id
  WHERE s.semaine_debut = p_lundi
  GROUP BY f.id, f.nom
  ORDER BY f.id;
$$;

-- 3. Confirmer une affectation ---------------------------------------------------
-- Une seule instruction UPDATE : l'index unique ux_seances_formateur_creneau
-- refuse le doublon de créneau, y compris si deux transactions arrivent en même temps.
CREATE OR REPLACE FUNCTION confirmer_affectation(p_seance text, p_formateur text)
RETURNS seances
LANGUAGE plpgsql
SET search_path = matrice, pg_temp
AS $$
DECLARE
  resultat seances;
BEGIN
  UPDATE seances
     SET formateur_id = p_formateur,
         statut = 'confirmed'
   WHERE id = p_seance
  RETURNING * INTO resultat;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'séance % introuvable', p_seance USING ERRCODE = 'no_data_found';
  END IF;
  RETURN resultat;
END;
$$;

-- 4. Heures par formateur ---------------------------------------------------------
-- Séances confirmées uniquement ; formateurs sans séance inclus (0 h).
CREATE OR REPLACE FUNCTION heures_par_formateur(p_du date, p_au date)
RETURNS TABLE (id text, nom text, nb_seances bigint, heures numeric)
LANGUAGE sql STABLE
SET search_path = matrice, pg_temp
AS $$
  SELECT f.id, f.nom, count(s.id),
         round(coalesce(sum(s.duree_minutes), 0) / 60.0, 1)
  FROM formateurs f
  LEFT JOIN seances s
         ON s.formateur_id = f.id
        AND s.statut = 'confirmed'
        AND s.date BETWEEN p_du AND p_au
  GROUP BY f.id, f.nom
  ORDER BY 4 DESC, 1;  -- heures décroissantes, puis id
$$;

-- 5. Retrouver les acquis validés ------------------------------------------------
CREATE OR REPLACE FUNCTION acquis_valides(p_lundi date)
RETURNS TABLE (seance text, titre text, groupe text, acquis text, valide_le timestamptz)
LANGUAGE sql STABLE
SET search_path = matrice, pg_temp
AS $$
  SELECT s.id, s.titre, s.groupe, a.libelle, a.valide_le
  FROM acquis a
  JOIN seances s ON s.id = a.seance_id
  WHERE a.valide
    AND s.semaine_debut = p_lundi
  ORDER BY s.date, s.periode, s.id, a.libelle;
$$;
