-- =============================================================================
-- B1 — Jeu de données fourni par le sujet (formateurs fictifs, aucune donnée réelle)
-- =============================================================================
SET search_path = matrice;

INSERT INTO formateurs (id, nom) VALUES
  ('t1', 'Camille Exemple'),
  ('t2', 'Alex Démonstration'),
  ('t3', 'Sam Fictif');

INSERT INTO semaines (debut, libelle) VALUES
  ('2026-10-19', 'S08 — Bloc HTML/CSS et UX');

INSERT INTO seances (id, date, periode, groupe, mode, titre, domaine, formateur_id, statut) VALUES
  ('s01', '2026-10-19', 'am', 'A',         'DG',   'React composants',  'web',    't1', 'confirmed'),
  ('s02', '2026-10-19', 'am', 'B',         'DG',   'React événements',  'web',    't2', 'confirmed'),
  ('s03', '2026-10-19', 'pm', 'Promotion', 'CE',   'Données et SQL',    'data',   't1', 'confirmed'),
  ('s04', '2026-10-20', 'am', 'A',         'DG',   'Authentification',  'cyber',  't2', 'proposed'),
  ('s05', '2026-10-20', 'am', 'B',         'DG',   'Revue de projet',   'projet', 't3', 'proposed'),
  ('s06', '2026-10-20', 'pm', 'Promotion', 'AUTO', 'Travail autonome',  'projet', NULL, 'proposed');

-- Acquis observables (exemples) : certains validés, d'autres non
INSERT INTO acquis (seance_id, libelle, valide, valide_le) VALUES
  ('s01', 'Découper une interface en composants',        true,  '2026-10-19 12:00+02'),
  ('s01', 'Passer des données par les props',             true,  '2026-10-19 12:00+02'),
  ('s01', 'Expliquer le rôle de la clé dans une liste',   false, NULL),
  ('s02', 'Gérer un événement de formulaire',             true,  '2026-10-19 12:15+02'),
  ('s03', 'Écrire une jointure entre deux tables',        true,  '2026-10-19 17:00+02'),
  ('s03', 'Justifier le choix d''un index',               false, NULL),
  ('s04', 'Expliquer le hachage d''un mot de passe',      false, NULL);
