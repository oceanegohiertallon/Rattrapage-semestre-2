-- =============================================================================
-- B1 — Schéma MATRiCE (PostgreSQL 17)
-- formateurs 1 ── N séances N ── 1 semaines ; séances 1 ── N acquis
-- Toutes les règles du sujet sont portées par la base (CHECK, FK, index unique) :
-- aucune application ne peut les contourner, même en écrivant en parallèle.
-- =============================================================================

DROP SCHEMA IF EXISTS matrice CASCADE;
CREATE SCHEMA matrice;
SET search_path = matrice;

-- Formateurs ------------------------------------------------------------------
CREATE TABLE formateurs (
  id   text PRIMARY KEY CHECK (id ~ '^t[0-9]+$'),           -- t1, t2, ...
  nom  text NOT NULL CHECK (btrim(nom) <> '')
);

-- Semaines --------------------------------------------------------------------
-- Une semaine est identifiée par son lundi : clé naturelle, lisible, sans ambiguïté.
CREATE TABLE semaines (
  debut    date PRIMARY KEY CHECK (EXTRACT(ISODOW FROM debut) = 1),  -- toujours un lundi
  libelle  text NOT NULL
);

-- Séances ---------------------------------------------------------------------
CREATE TABLE seances (
  id             text PRIMARY KEY CHECK (btrim(id) <> ''),
  date           date NOT NULL,
  periode        text NOT NULL CHECK (periode IN ('am', 'pm')),
  groupe         text NOT NULL CHECK (groupe IN ('A', 'B', 'Promotion')),
  mode           text NOT NULL CHECK (mode IN ('DG', 'CE', 'AUTO')),
  titre          text NOT NULL CHECK (btrim(titre) <> ''),
  domaine        text NOT NULL CHECK (domaine IN ('web', 'data', 'cyber', 'ia', 'design', 'projet')),
  formateur_id   text REFERENCES formateurs (id),            -- NULL = pas encore affectée
  statut         text NOT NULL DEFAULT 'proposed' CHECK (statut IN ('proposed', 'confirmed')),
  duree_minutes  integer NOT NULL DEFAULT 210 CHECK (duree_minutes BETWEEN 30 AND 300),  -- demi-journée = 3 h 30

  -- La semaine est DÉDUITE de la date (lundi de la date) : impossible de ranger
  -- une séance dans une semaine qui ne la contient pas. La FK impose que la semaine existe.
  semaine_debut  date GENERATED ALWAYS AS (date - (EXTRACT(ISODOW FROM date)::integer - 1)) STORED
                 NOT NULL REFERENCES semaines (debut),

  -- Règles du sujet
  CONSTRAINT auto_sans_formateur_et_proposee
    CHECK (mode <> 'AUTO' OR (formateur_id IS NULL AND statut = 'proposed')),
  CONSTRAINT confirmation_exige_formateur
    CHECK (statut <> 'confirmed' OR formateur_id IS NOT NULL)
);

-- RÈGLE CENTRALE : un formateur ne peut pas avoir deux séances sur le même créneau
-- (même date + même période). Index UNIQUE partiel : les séances sans formateur
-- ne sont pas concernées. PostgreSQL vérifie l'unicité au moment de l'écriture et
-- fait ATTENDRE une transaction concurrente sur la même clé jusqu'au COMMIT/ROLLBACK
-- de la première : la seconde échoue alors (23505). Aucun « vérifier puis écrire »
-- côté application ne peut offrir cette garantie (voir tests/test-concurrence.sh).
CREATE UNIQUE INDEX ux_seances_formateur_creneau
  ON seances (formateur_id, date, periode)
  WHERE formateur_id IS NOT NULL;

-- Planning d'une semaine, trié comme à l'écran
CREATE INDEX ix_seances_semaine ON seances (semaine_debut, date, periode, groupe);

-- Acquis ----------------------------------------------------------------------
-- Critères observables d'une séance (« expliquer », « produire », « tester »…)
CREATE TABLE acquis (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  seance_id  text NOT NULL REFERENCES seances (id) ON DELETE CASCADE,
  libelle    text NOT NULL CHECK (btrim(libelle) <> ''),
  valide     boolean NOT NULL DEFAULT false,
  valide_le  timestamptz,
  CONSTRAINT date_de_validation_coherente CHECK (valide = (valide_le IS NOT NULL)),
  CONSTRAINT acquis_unique_par_seance UNIQUE (seance_id, libelle)
);
-- Sert la FK (suppression en cascade) et la recherche des acquis d'une séance.
-- La contrainte UNIQUE (seance_id, libelle) fournit déjà cet index : pas de doublon.

-- Acquis validés : index partiel, ne contient que les lignes validées
CREATE INDEX ix_acquis_valides ON acquis (seance_id) INCLUDE (libelle, valide_le) WHERE valide;
