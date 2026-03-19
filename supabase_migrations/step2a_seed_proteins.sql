-- ============================================================
-- CSV TEAM — STEP 2A: SEED PROTEINS + FISH + EGGS
-- Run AFTER step1_create_table.sql
-- ============================================================

INSERT INTO food_items (name, category, subcategory, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, raw_or_cooked, searchable_aliases) VALUES
-- LEAN PROTEIN — Poultry
('Petto di pollo (crudo)', 'lean_protein', 'poultry', 100, 23.3, 0.0, 0.8, 0, 'raw', '{"pollo","chicken breast","petto pollo","chicken"}'),
('Petto di pollo (cotto)', 'lean_protein', 'poultry', 165, 31.0, 0.0, 3.6, 0, 'cooked', '{"pollo cotto","grilled chicken","pollo alla piastra"}'),
('Coscia di pollo (senza pelle)', 'lean_protein', 'poultry', 119, 20.0, 0.0, 4.2, 0, 'raw', '{"coscia pollo","chicken thigh"}'),
('Fesa di tacchino (cruda)', 'lean_protein', 'poultry', 104, 24.0, 0.0, 1.0, 0, 'raw', '{"tacchino","turkey breast","petto tacchino"}'),
('Fesa di tacchino (affettato)', 'lean_protein', 'poultry', 95, 20.0, 1.0, 1.5, 0, 'na', '{"affettato tacchino","fettine tacchino","turkey slices"}'),
('Petto di tacchino (cotto)', 'lean_protein', 'poultry', 157, 30.0, 0.0, 3.2, 0, 'cooked', '{"tacchino cotto","cooked turkey"}'),

-- LEAN PROTEIN — Beef
('Manzo magro (crudo)', 'lean_protein', 'beef', 114, 21.0, 0.0, 3.0, 0, 'raw', '{"manzo","beef","carne rossa","carne bovina"}'),
('Manzo magro (cotto)', 'lean_protein', 'beef', 175, 26.0, 0.0, 8.0, 0, 'cooked', '{"manzo cotto","cooked beef"}'),
('Macinato di manzo (magro 5%)', 'lean_protein', 'beef', 137, 21.0, 0.0, 5.0, 0, 'raw', '{"macinato","ground beef","carne trita","hamburger"}'),
('Vitello (magro)', 'lean_protein', 'beef', 107, 21.0, 0.0, 2.5, 0, 'raw', '{"carne di vitello","veal"}'),
('Filetto di manzo', 'lean_protein', 'beef', 143, 22.0, 0.0, 5.5, 0, 'raw', '{"filetto","beef filet","tenderloin"}'),
('Carpaccio di manzo', 'lean_protein', 'beef', 121, 20.0, 0.0, 4.0, 0, 'raw', '{"carpaccio","beef carpaccio"}'),

-- LEAN PROTEIN — Pork
('Lonza di maiale', 'lean_protein', 'pork', 143, 22.0, 0.0, 5.5, 0, 'raw', '{"maiale","pork loin","lonza"}'),
('Arista di maiale (cotta)', 'lean_protein', 'pork', 172, 27.0, 0.0, 7.0, 0, 'cooked', '{"arista","roast pork"}'),

-- FATTY PROTEIN
('Salsiccia di suino', 'fatty_protein', 'pork', 304, 14.0, 1.5, 27.0, 0, 'raw', '{"salsiccia","sausage","luganega"}'),
('Costata di manzo', 'fatty_protein', 'beef', 250, 18.0, 0.0, 20.0, 0, 'raw', '{"costata","ribeye","entrecote"}'),
('Macinato di manzo (grasso 20%)', 'fatty_protein', 'beef', 254, 17.0, 0.0, 20.0, 0, 'raw', '{"macinato grasso","fatty ground beef"}'),

-- PROCESSED MEATS
('Bresaola della Valtellina', 'lean_protein', 'processed', 151, 32.0, 0.0, 2.6, 0, 'na', '{"bresaola","dried beef"}'),
('Prosciutto crudo (magro)', 'fatty_protein', 'processed', 173, 27.0, 0.0, 7.0, 0, 'na', '{"crudo","prosciutto","parma ham"}'),
('Prosciutto cotto (magro)', 'lean_protein', 'processed', 132, 20.0, 1.0, 5.0, 0, 'na', '{"prosciutto cotto","cooked ham"}'),
('Prosciutto cotto (standard)', 'fatty_protein', 'processed', 147, 20.0, 1.0, 7.0, 0, 'na', '{"prosciutto cotto grasso"}'),
('Speck', 'fatty_protein', 'processed', 303, 28.0, 0.5, 20.0, 0, 'na', '{"speck alto adige"}'),
('Mortadella', 'fatty_protein', 'processed', 311, 14.0, 1.5, 28.0, 0, 'na', '{"mortadella bologna"}'),
('Salame Milano', 'fatty_protein', 'processed', 425, 22.0, 1.0, 37.0, 0, 'na', '{"salame","salami"}'),
('Coppa / Capocollo', 'fatty_protein', 'processed', 398, 20.0, 0.5, 35.0, 0, 'na', '{"coppa","capocollo"}'),
('Pancetta', 'fatty_protein', 'processed', 458, 14.0, 0.0, 45.0, 0, 'na', '{"pancetta","bacon"}'),
('Würstel (pollo/tacchino)', 'fatty_protein', 'processed', 175, 12.0, 2.0, 13.0, 0, 'na', '{"wurstel","hot dog","frankfurter"}'),

-- FISH
('Salmone fresco', 'fatty_protein', 'fish', 208, 20.0, 0.0, 13.0, 0, 'raw', '{"salmon","salmone"}'),
('Salmone affumicato', 'fatty_protein', 'fish', 117, 25.4, 0.0, 4.5, 0, 'na', '{"smoked salmon","salmone affumicato"}'),
('Tonno al naturale (sgocciolato)', 'lean_protein', 'fish', 103, 25.0, 0.0, 0.5, 0, 'na', '{"tonno","tuna","tonno scatola"}'),
('Tonno sott''olio (sgocciolato)', 'fatty_protein', 'fish', 198, 25.0, 0.0, 10.0, 0, 'na', '{"tonno olio","tuna in oil"}'),
('Merluzzo (filetto)', 'lean_protein', 'fish', 71, 17.0, 0.0, 0.3, 0, 'raw', '{"nasello","cod","merluzzo"}'),
('Orata', 'lean_protein', 'fish', 90, 19.8, 0.0, 1.2, 0, 'raw', '{"orata","sea bream"}'),
('Branzino (Spigola)', 'lean_protein', 'fish', 97, 19.0, 0.0, 2.0, 0, 'raw', '{"branzino","spigola","sea bass"}'),
('Pesce spada', 'lean_protein', 'fish', 121, 20.0, 0.0, 4.0, 0, 'raw', '{"spada","swordfish"}'),
('Sogliola', 'lean_protein', 'fish', 70, 14.0, 0.0, 1.5, 0, 'raw', '{"sogliola","sole"}'),
('Trota', 'lean_protein', 'fish', 119, 20.0, 0.0, 3.5, 0, 'raw', '{"trota","trout"}'),
('Sgombro', 'fatty_protein', 'fish', 205, 19.0, 0.0, 14.0, 0, 'raw', '{"sgombro","mackerel"}'),
('Alici / Acciughe', 'fatty_protein', 'fish', 131, 20.0, 0.0, 5.0, 0, 'raw', '{"acciughe","alici","anchovies"}'),
('Sardine sott''olio', 'fatty_protein', 'fish', 208, 25.0, 0.0, 11.0, 0, 'na', '{"sardine","sardines"}'),

-- SEAFOOD
('Gamberi (crudi)', 'lean_protein', 'seafood', 71, 13.6, 2.9, 0.6, 0, 'raw', '{"gamberetti","shrimp","prawns"}'),
('Calamari (crudi)', 'lean_protein', 'seafood', 68, 12.6, 1.5, 1.7, 0, 'raw', '{"calamaro","squid"}'),
('Polpo', 'lean_protein', 'seafood', 82, 15.0, 2.2, 1.0, 0, 'raw', '{"polpo","octopus"}'),
('Cozze', 'lean_protein', 'seafood', 86, 12.0, 3.7, 2.2, 0, 'raw', '{"cozze","mussels"}'),
('Vongole', 'lean_protein', 'seafood', 72, 12.0, 2.6, 1.0, 0, 'raw', '{"vongole","clams"}'),
('Surimi / Bastoncini di granchio', 'lean_protein', 'seafood', 95, 8.0, 13.0, 0.5, 0, 'na', '{"surimi","crab sticks","bastoncini pesce"}'),

-- EGGS
('Uovo intero', 'fatty_protein', 'eggs', 143, 12.5, 0.7, 9.5, 0, 'raw', '{"uova","egg","uovo","whole egg"}'),
('Albume d''uovo', 'lean_protein', 'eggs', 52, 11.1, 0.7, 0.2, 0, 'raw', '{"bianco uovo","egg white","albume liquido"}'),
('Tuorlo d''uovo', 'fatty_protein', 'eggs', 322, 16.0, 0.6, 27.0, 0, 'raw', '{"rosso uovo","egg yolk","tuorlo"}')
ON CONFLICT DO NOTHING;
