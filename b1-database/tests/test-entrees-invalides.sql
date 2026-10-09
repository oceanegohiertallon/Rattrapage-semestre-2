-- =============================================================================
-- B1 — Refus des entrées invalides (et acceptation des entrées valides)
-- Chaque cas s'exécute dans un sous-bloc : on vérifie le CODE d'erreur attendu
-- (SQLSTATE), pas seulement « qu'il y a une erreur ». Tout est annulé à la fin.
-- Lance : psql -v ON_ERROR_STOP=1 -f tests/test-entrees-invalides.sql
--   -> s'arrête au premier cas qui ne se comporte pas comme prévu.
-- =============================================================================
\set QUIET on
SET search_path = matrice;
\pset tuples_only on
\pset format unaligned
BEGIN;

CREATE FUNCTION pg_temp.doit_echouer(cas text, requete text, code_attendu text)
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  BEGIN
    EXECUTE requete;
  EXCEPTION WHEN others THEN
    IF SQLSTATE = code_attendu THEN
      RETURN format('OK  refusé   [%s] %s  ->  %s', SQLSTATE, cas, SQLERRM);
    END IF;
    RAISE EXCEPTION 'ÉCHEC  % : attendu %, obtenu % (%)', cas, code_attendu, SQLSTATE, SQLERRM;
  END;
  RAISE EXCEPTION 'ÉCHEC  % : accepté alors qu''il devait être refusé', cas;
END $$;

CREATE FUNCTION pg_temp.doit_reussir(cas text, requete text)
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE requete;
  RETURN format('OK  accepté           %s', cas);
END $$;

-- Valeurs autorisées (CHECK : 23514) ---------------------------------------------
SELECT pg_temp.doit_echouer('période « soir »',
  $q$SELECT creer_seance('x01','2026-10-21','soir','A','DG','Test','web')$q$, '23514');
SELECT pg_temp.doit_echouer('groupe « C »',
  $q$SELECT creer_seance('x02','2026-10-21','am','C','DG','Test','web')$q$, '23514');
SELECT pg_temp.doit_echouer('mode inconnu « VISIO »',
  $q$SELECT creer_seance('x03','2026-10-21','am','A','VISIO','Test','web')$q$, '23514');
SELECT pg_temp.doit_echouer('statut « annulé »',
  $q$SELECT creer_seance('x04','2026-10-21','am','A','DG','Test','web','t1','annulé')$q$, '23514');
SELECT pg_temp.doit_echouer('titre vide',
  $q$SELECT creer_seance('x05','2026-10-21','am','A','DG','   ','web')$q$, '23514');
SELECT pg_temp.doit_echouer('semaine qui ne commence pas un lundi',
  $q$INSERT INTO semaines VALUES ('2026-10-21','mercredi')$q$, '23514');

-- Règles métier croisées (CHECK : 23514) ----------------------------------------
SELECT pg_temp.doit_echouer('AUTO avec un formateur',
  $q$SELECT creer_seance('x06','2026-10-21','pm','Promotion','AUTO','Autonomie','projet','t1')$q$, '23514');
SELECT pg_temp.doit_echouer('AUTO confirmée',
  $q$SELECT creer_seance('x07','2026-10-21','pm','Promotion','AUTO','Autonomie','projet',NULL,'confirmed')$q$, '23514');
SELECT pg_temp.doit_echouer('confirmée sans formateur',
  $q$SELECT creer_seance('x08','2026-10-21','am','A','DG','Test','web',NULL,'confirmed')$q$, '23514');
SELECT pg_temp.doit_echouer('confirmer l''affectation d''une séance AUTO (s06)',
  $q$SELECT confirmer_affectation('s06','t3')$q$, '23514');
SELECT pg_temp.doit_echouer('acquis validé sans date de validation',
  $q$INSERT INTO acquis (seance_id, libelle, valide) VALUES ('s01','Nouveau', true)$q$, '23514');

-- Références (FK : 23503) ---------------------------------------------------------
SELECT pg_temp.doit_echouer('formateur inconnu t9',
  $q$SELECT creer_seance('x09','2026-10-21','am','A','DG','Test','web','t9')$q$, '23503');
SELECT pg_temp.doit_echouer('séance dans une semaine non déclarée (insertion directe)',
  $q$INSERT INTO seances (id,date,periode,groupe,mode,titre,domaine) VALUES ('x10','2027-03-03','am','A','DG','Test','web')$q$, '23503');

-- Types (22008 : date inexistante) -------------------------------------------------
SELECT pg_temp.doit_echouer('date 2026-02-30',
  $q$SELECT creer_seance('x11','2026-02-30','am','A','DG','Test','web')$q$, '22008');

-- Unicité (23505) ----------------------------------------------------------------
SELECT pg_temp.doit_echouer('identifiant déjà utilisé (s01)',
  $q$SELECT creer_seance('s01','2026-10-21','am','A','DG','Test','web')$q$, '23505');
SELECT pg_temp.doit_echouer('t1 déjà sur le créneau 19/10 matin (s01) : création',
  $q$SELECT creer_seance('x12','2026-10-19','am','Promotion','CE','Conférence','web','t1')$q$, '23505');
SELECT pg_temp.doit_echouer('t2 déjà sur le créneau 20/10 matin (s04) : confirmation de s05',
  $q$SELECT confirmer_affectation('s05','t2')$q$, '23505');

-- Séance inexistante (P0002) -----------------------------------------------------
SELECT pg_temp.doit_echouer('confirmer une séance inexistante',
  $q$SELECT confirmer_affectation('zz9','t1')$q$, 'P0002');

-- Cas valides : la validation ne bloque pas les entrées correctes -----------------
SELECT pg_temp.doit_reussir('créer une séance proposée sans formateur',
  $q$SELECT creer_seance('x20','2026-10-21','am','A','DG','Tests front','web')$q$);
SELECT pg_temp.doit_reussir('créer une séance dans une nouvelle semaine (semaine créée)',
  $q$SELECT creer_seance('x21','2026-11-02','am','B','DG','Docker','web','t3')$q$);
SELECT pg_temp.doit_reussir('t1 sur un autre créneau (20/10 après-midi), confirmé',
  $q$SELECT creer_seance('x22','2026-10-20','pm','A','CE','Atelier SQL','data','t1','confirmed')$q$);
SELECT pg_temp.doit_reussir('confirmer s04 avec t2 (déjà proposé sur ce créneau)',
  $q$SELECT confirmer_affectation('s04','t2')$q$);
SELECT pg_temp.doit_reussir('séance AUTO sans formateur, proposée',
  $q$SELECT creer_seance('x23','2026-10-21','pm','Promotion','AUTO','Autonomie','projet')$q$);

\echo
\echo 'Tous les cas se sont comportés comme prévu.'
ROLLBACK;  -- la base retrouve exactement son état initial
