-- ============================================================
-- CSV TEAM — STEP 1: CREATE TABLE + INDEXES + RLS
-- Run this FIRST in Supabase SQL Editor
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS food_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    subcategory TEXT,
    brand TEXT,
    serving_type TEXT DEFAULT 'g',
    grams_per_serving NUMERIC(5,1) DEFAULT 100,
    calories_per_100g NUMERIC(6,1) NOT NULL,
    protein_per_100g NUMERIC(5,1) NOT NULL,
    carbs_per_100g NUMERIC(5,1) NOT NULL,
    fat_per_100g NUMERIC(5,1) NOT NULL,
    fiber_per_100g NUMERIC(5,1),
    raw_or_cooked TEXT DEFAULT 'na',
    verified BOOLEAN DEFAULT true,
    is_core BOOLEAN DEFAULT true,
    searchable_aliases TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_food_name ON food_items(name);
CREATE INDEX IF NOT EXISTS idx_food_category ON food_items(category);
CREATE INDEX IF NOT EXISTS idx_food_aliases ON food_items USING GIN(searchable_aliases);

ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read food_items" ON food_items;
CREATE POLICY "Anyone can read food_items" ON food_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anon can insert food_items" ON food_items;
CREATE POLICY "Anon can insert food_items" ON food_items FOR INSERT WITH CHECK (true);
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
-- ============================================================
-- CSV TEAM — STEP 2B: SEED DAIRY + CARBS + GRAINS + BREAD
-- Run AFTER step2a
-- ============================================================

INSERT INTO food_items (name, category, subcategory, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, raw_or_cooked, searchable_aliases) VALUES
-- DAIRY — Milk
('Latte intero', 'dairy', 'milk', 64, 3.3, 4.9, 3.6, 0, 'na', '{"whole milk","latte"}'),
('Latte parzialmente scremato', 'dairy', 'milk', 46, 3.3, 5.0, 1.5, 0, 'na', '{"latte ps","semi-skimmed milk"}'),
('Latte scremato', 'dairy', 'milk', 34, 3.4, 5.0, 0.1, 0, 'na', '{"skim milk","latte magro"}'),
('Latte di soia', 'dairy', 'milk', 33, 2.8, 1.2, 1.8, 0, 'na', '{"soy milk","bevanda soia"}'),
('Latte di avena', 'dairy', 'milk', 46, 1.0, 7.0, 1.5, 0.8, 'na', '{"oat milk","bevanda avena"}'),
('Latte di mandorla', 'dairy', 'milk', 13, 0.4, 0.5, 1.1, 0, 'na', '{"almond milk","bevanda mandorla"}'),
('Latte di riso', 'dairy', 'milk', 47, 0.3, 9.2, 1.0, 0, 'na', '{"rice milk","bevanda riso"}'),
('Latte di cocco', 'dairy', 'milk', 187, 1.6, 2.0, 19.0, 0, 'na', '{"coconut milk"}'),
('Panna da cucina', 'dairy', 'milk', 195, 2.5, 3.5, 19.0, 0, 'na', '{"panna","cream","heavy cream"}'),
('Panna montata', 'dairy', 'milk', 257, 2.0, 12.0, 22.0, 0, 'na', '{"whipped cream"}'),

-- DAIRY — Yogurt
('Yogurt Greco 0% grassi', 'dairy', 'yogurt', 52, 10.3, 4.0, 0.0, 0, 'na', '{"fage 0","greek yogurt","yogurt magro","skyr"}'),
('Yogurt Greco 2% grassi', 'dairy', 'yogurt', 73, 9.0, 4.0, 2.0, 0, 'na', '{"fage 2","yogurt greco light"}'),
('Yogurt Greco 5% grassi', 'dairy', 'yogurt', 96, 9.0, 3.0, 5.0, 0, 'na', '{"fage total","greek yogurt full fat"}'),
('Yogurt bianco intero', 'dairy', 'yogurt', 61, 3.5, 4.7, 3.3, 0, 'na', '{"yogurt naturale","plain yogurt"}'),
('Yogurt bianco magro', 'dairy', 'yogurt', 36, 4.3, 4.0, 0.1, 0, 'na', '{"yogurt 0","low fat yogurt"}'),
('Skyr', 'dairy', 'yogurt', 63, 11.0, 4.0, 0.2, 0, 'na', '{"skyr islandese","icelandic yogurt"}'),
('Yogurt alla frutta', 'dairy', 'yogurt', 82, 3.0, 14.0, 1.5, 0, 'na', '{"fruit yogurt","yogurt fragola"}'),

-- DAIRY — Cheese
('Parmigiano Reggiano', 'dairy', 'cheese', 392, 33.0, 0.0, 28.4, 0, 'na', '{"grana padano","parmesan","parmigiano"}'),
('Mozzarella di vacca', 'dairy', 'cheese', 254, 20.0, 1.0, 19.5, 0, 'na', '{"mozzarella","fior di latte"}'),
('Mozzarella light', 'dairy', 'cheese', 163, 20.5, 1.5, 9.0, 0, 'na', '{"mozzarella magra","light mozzarella"}'),
('Mozzarella di bufala', 'dairy', 'cheese', 288, 16.7, 0.4, 24.0, 0, 'na', '{"bufala","buffalo mozzarella"}'),
('Ricotta di mucca', 'dairy', 'cheese', 146, 8.8, 3.5, 10.9, 0, 'na', '{"ricotta","ricotta vaccina"}'),
('Ricotta light', 'dairy', 'cheese', 102, 10.0, 4.0, 5.0, 0, 'na', '{"ricotta magra"}'),
('Fiocchi di latte', 'dairy', 'cheese', 85, 13.0, 3.5, 2.2, 0, 'na', '{"cottage cheese","jocca","fiocchi latte"}'),
('Stracchino', 'dairy', 'cheese', 300, 18.5, 0.0, 25.0, 0, 'na', '{"crescenza","stracchino"}'),
('Scamorza', 'dairy', 'cheese', 334, 25.0, 1.0, 25.0, 0, 'na', '{"scamorza affumicata"}'),
('Emmental', 'dairy', 'cheese', 370, 27.0, 0.0, 29.0, 0, 'na', '{"emmentaler","swiss cheese"}'),
('Pecorino Romano', 'dairy', 'cheese', 387, 32.0, 0.0, 28.0, 0, 'na', '{"pecorino"}'),
('Gorgonzola', 'dairy', 'cheese', 353, 21.0, 0.0, 29.0, 0, 'na', '{"gorgonzola","blue cheese"}'),
('Formaggio spalmabile light', 'dairy', 'cheese', 135, 8.0, 4.0, 10.0, 0, 'na', '{"philadelphia light","cream cheese light"}'),
('Formaggio spalmabile classico', 'dairy', 'cheese', 253, 5.5, 3.0, 25.0, 0, 'na', '{"philadelphia","cream cheese"}'),
('Sottilette / Fette formaggio', 'dairy', 'cheese', 260, 18.0, 4.0, 19.0, 0, 'na', '{"sottilette","cheese slices"}'),
('Asiago', 'dairy', 'cheese', 356, 25.0, 0.0, 28.0, 0, 'na', '{"asiago","formaggio asiago"}'),

-- CARBS — Pasta & Grains
('Pasta di semola (cruda)', 'carbs', 'pasta', 353, 13.0, 79.0, 1.5, 2.5, 'raw', '{"spaghetti","penne","fusilli","pasta","maccheroni","rigatoni"}'),
('Pasta di semola (cotta)', 'carbs', 'pasta', 137, 5.0, 31.0, 0.6, 1.0, 'cooked', '{"pasta cotta","cooked pasta"}'),
('Pasta integrale (cruda)', 'carbs', 'pasta', 348, 14.0, 66.0, 2.5, 6.0, 'raw', '{"whole wheat pasta","pasta integrale"}'),
('Pasta di legumi (cruda)', 'carbs', 'pasta', 335, 22.0, 53.0, 3.0, 8.0, 'raw', '{"pasta lenticchie","legume pasta","pasta proteica"}'),
('Riso Basmati (crudo)', 'carbs', 'rice', 345, 8.5, 78.0, 0.3, 0.5, 'raw', '{"riso","basmati","basmati rice"}'),
('Riso Basmati (cotto)', 'carbs', 'rice', 121, 3.5, 25.0, 0.1, 0.2, 'cooked', '{"riso cotto","cooked rice"}'),
('Riso integrale (crudo)', 'carbs', 'rice', 337, 7.5, 77.0, 2.8, 3.5, 'raw', '{"brown rice","riso integrale"}'),
('Riso Jasmine (crudo)', 'carbs', 'rice', 348, 7.0, 79.0, 0.4, 0.5, 'raw', '{"jasmine rice","riso jasmine","riso thai"}'),
('Riso Arborio (crudo)', 'carbs', 'rice', 345, 6.5, 79.5, 0.6, 0.4, 'raw', '{"riso arborio","risotto rice"}'),
('Farro (crudo)', 'carbs', 'grains', 335, 15.0, 67.0, 2.5, 7.0, 'raw', '{"spelt","farro"}'),
('Orzo perlato (crudo)', 'carbs', 'grains', 325, 10.0, 71.0, 1.3, 10.0, 'raw', '{"barley","orzo"}'),
('Quinoa (cruda)', 'carbs', 'grains', 368, 14.1, 64.2, 6.1, 7.0, 'raw', '{"quinoa"}'),
('Cous cous (crudo)', 'carbs', 'grains', 356, 12.8, 72.0, 0.6, 3.6, 'raw', '{"couscous","cous cous"}'),
('Bulgur (crudo)', 'carbs', 'grains', 342, 12.3, 75.9, 1.3, 12.5, 'raw', '{"bulgur","grano spezzato"}'),
('Fiocchi d''avena', 'carbs', 'grains', 389, 16.9, 66.3, 6.9, 10.6, 'na', '{"avena","oats","porridge","overnight oats","fiocchi avena"}'),
('Crusca d''avena', 'carbs', 'grains', 246, 17.3, 66.2, 7.0, 15.4, 'na', '{"oat bran","crusca"}'),

-- BREAD & BAKED
('Pane bianco', 'carbs', 'bread', 265, 9.0, 54.0, 3.2, 2.7, 'na', '{"white bread","rosetta","ciabatta","pane"}'),
('Pane integrale', 'carbs', 'bread', 247, 13.0, 41.0, 3.4, 7.0, 'na', '{"whole wheat bread","pane nero"}'),
('Pane di segale', 'carbs', 'bread', 250, 8.5, 48.0, 3.3, 6.0, 'na', '{"rye bread","pane segale"}'),
('Piadina romagnola', 'carbs', 'bread', 324, 8.0, 48.0, 11.0, 2.0, 'na', '{"piadina","flatbread"}'),
('Gallette di riso', 'carbs', 'bread', 382, 8.0, 80.0, 3.0, 4.0, 'na', '{"rice cakes","gallette"}'),
('Gallette di mais', 'carbs', 'bread', 386, 7.0, 82.0, 2.5, 3.5, 'na', '{"corn cakes","gallette mais"}'),
('Fette biscottate', 'carbs', 'bread', 412, 11.5, 74.0, 5.5, 3.5, 'na', '{"fette biscottate","rusks","wasa"}'),
('Crackers integrali', 'carbs', 'bread', 410, 10.0, 65.0, 12.0, 7.0, 'na', '{"crackers","whole wheat crackers"}'),
('Pancarré (pan morbido)', 'carbs', 'bread', 265, 8.0, 50.0, 4.0, 2.0, 'na', '{"pan carre","toast bread","pane tramezzino"}'),
('Tarallini', 'carbs', 'bread', 480, 10.0, 60.0, 20.0, 3.0, 'na', '{"taralli","tarallini pugliesi"}'),
('Grissini', 'carbs', 'bread', 428, 12.0, 68.0, 12.0, 3.0, 'na', '{"breadsticks","grissini"}'),
('Focaccia genovese', 'carbs', 'bread', 282, 6.5, 40.0, 10.0, 2.0, 'na', '{"focaccia","schiacciata"}'),
('Wrap (tortilla)', 'carbs', 'bread', 312, 8.5, 52.0, 8.0, 2.0, 'na', '{"tortilla","wrap","piadina mexicana"}'),

-- CARBS — Tubers
('Patate (crude)', 'carbs', 'tubers', 77, 2.0, 17.5, 0.1, 1.8, 'raw', '{"potatoes","patata","patate"}'),
('Patate (bollite)', 'carbs', 'tubers', 87, 1.9, 20.0, 0.1, 1.4, 'cooked', '{"boiled potato","patate lesse"}'),
('Patate dolci (Americane)', 'carbs', 'tubers', 86, 1.6, 20.1, 0.1, 3.0, 'raw', '{"sweet potato","batata","patata americana"}'),

-- LEGUMES
('Lenticchie (cotte)', 'carbs', 'legumes', 116, 9.0, 20.0, 0.4, 8.0, 'cooked', '{"lenticchie","lentils"}'),
('Lenticchie (secche)', 'carbs', 'legumes', 353, 25.0, 60.0, 1.1, 11.0, 'raw', '{"lenticchie secche","dry lentils"}'),
('Ceci (cotti)', 'carbs', 'legumes', 164, 9.0, 27.0, 2.6, 8.0, 'cooked', '{"ceci","chickpeas"}'),
('Fagioli borlotti (cotti)', 'carbs', 'legumes', 127, 9.0, 23.0, 0.5, 7.0, 'cooked', '{"fagioli","borlotti","beans"}'),
('Fagioli cannellini (cotti)', 'carbs', 'legumes', 118, 8.0, 21.0, 0.5, 6.0, 'cooked', '{"cannellini","white beans"}'),
('Piselli (cotti)', 'carbs', 'legumes', 81, 5.4, 14.5, 0.4, 5.0, 'cooked', '{"piselli","peas"}'),
('Edamame', 'carbs', 'legumes', 121, 12.0, 9.0, 5.0, 5.0, 'cooked', '{"edamame","soia verde"}'),
('Hummus', 'fats', 'legumes', 166, 8.0, 14.0, 10.0, 6.0, 'na', '{"hummus","crema ceci"}'),
('Tofu naturale', 'lean_protein', 'legumes', 76, 8.0, 1.9, 4.2, 0.3, 'na', '{"tofu","bean curd"}')
ON CONFLICT DO NOTHING;
-- ============================================================
-- CSV TEAM — STEP 2C: SEED FATS, FRUITS, VEGETABLES, NUTS, 
--                      SWEETS, BEVERAGES, FITNESS FOODS
-- Run AFTER step2b
-- ============================================================

INSERT INTO food_items (name, category, subcategory, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, raw_or_cooked, searchable_aliases) VALUES
-- FATS & OILS
('Olio Extravergine d''Oliva', 'fats', 'oils', 899, 0.0, 0.0, 99.9, 0, 'na', '{"olio evo","olive oil","olio oliva"}'),
('Olio di semi', 'fats', 'oils', 899, 0.0, 0.0, 99.9, 0, 'na', '{"olio semi","seed oil","olio girasole"}'),
('Olio di cocco', 'fats', 'oils', 862, 0.0, 0.0, 99.1, 0, 'na', '{"coconut oil","olio cocco"}'),
('Burro', 'fats', 'butter', 717, 0.8, 0.1, 81.1, 0, 'na', '{"butter","burro"}'),
('Burro d''arachidi', 'fats', 'nut_butter', 588, 25.0, 20.0, 50.0, 6.0, 'na', '{"peanut butter","crema arachidi","pb"}'),
('Burro di mandorle', 'fats', 'nut_butter', 614, 21.0, 19.0, 56.0, 4.0, 'na', '{"almond butter","crema mandorle"}'),
('Crema di nocciole e cacao', 'fats', 'nut_butter', 539, 6.0, 57.0, 31.0, 2.0, 'na', '{"nutella","crema nocciole","hazelnut spread"}'),
('Tahini (crema di sesamo)', 'fats', 'nut_butter', 595, 17.0, 21.0, 54.0, 9.0, 'na', '{"tahini","sesame paste"}'),
('Maionese', 'fats', 'condiments', 680, 1.0, 1.0, 75.0, 0, 'na', '{"mayo","maionese"}'),
('Maionese light', 'fats', 'condiments', 260, 1.0, 6.0, 25.0, 0, 'na', '{"mayo light","maionese leggera"}'),
('Avocado', 'fats', 'fruit', 160, 2.0, 8.5, 14.7, 6.7, 'raw', '{"avocado"}'),

-- NUTS & SEEDS
('Mandorle (sgusciate)', 'nuts', 'nuts', 579, 21.2, 21.6, 49.9, 12.5, 'na', '{"almonds","mandorle"}'),
('Noci (sgusciate)', 'nuts', 'nuts', 654, 15.2, 13.7, 65.2, 6.7, 'na', '{"walnuts","noci"}'),
('Nocciole (sgusciate)', 'nuts', 'nuts', 628, 15.0, 17.0, 61.0, 9.7, 'na', '{"hazelnuts","nocciole"}'),
('Anacardi', 'nuts', 'nuts', 553, 18.2, 30.2, 44.0, 3.3, 'na', '{"cashews","anacardi"}'),
('Pistacchi (sgusciati)', 'nuts', 'nuts', 562, 20.2, 27.0, 45.0, 10.6, 'na', '{"pistachios","pistacchi"}'),
('Arachidi tostate', 'nuts', 'nuts', 585, 26.0, 16.0, 49.0, 8.0, 'na', '{"peanuts","arachidi","noccioline"}'),
('Noci del Brasile', 'nuts', 'nuts', 656, 14.3, 12.3, 66.0, 7.5, 'na', '{"brazil nuts","noci brasile"}'),
('Noci di macadamia', 'nuts', 'nuts', 718, 8.0, 14.0, 76.0, 8.6, 'na', '{"macadamia"}'),
('Mix frutta secca', 'nuts', 'nuts', 607, 20.0, 17.0, 54.0, 7.0, 'na', '{"trail mix","frutta secca mista","mixed nuts"}'),
('Semi di chia', 'nuts', 'seeds', 486, 17.0, 42.0, 31.0, 34.4, 'na', '{"chia seeds","semi chia"}'),
('Semi di lino', 'nuts', 'seeds', 534, 18.3, 29.0, 42.0, 27.3, 'na', '{"flax seeds","semi lino","linseed"}'),
('Semi di zucca', 'nuts', 'seeds', 559, 30.0, 11.0, 49.0, 6.0, 'na', '{"pumpkin seeds","semi zucca"}'),
('Semi di girasole', 'nuts', 'seeds', 584, 21.0, 20.0, 51.0, 9.0, 'na', '{"sunflower seeds","semi girasole"}'),

-- FRUITS
('Mela', 'fruit', 'common', 52, 0.3, 13.8, 0.2, 2.4, 'na', '{"apple","mela"}'),
('Banana', 'fruit', 'common', 89, 1.1, 22.8, 0.3, 2.6, 'na', '{"banana"}'),
('Arancia', 'fruit', 'common', 47, 0.9, 11.8, 0.1, 2.4, 'na', '{"orange","arancia"}'),
('Mandarino', 'fruit', 'common', 53, 0.8, 13.3, 0.3, 1.8, 'na', '{"tangerine","mandarino","clementina"}'),
('Fragole', 'fruit', 'berries', 32, 0.7, 7.7, 0.3, 2.0, 'na', '{"strawberries","fragole"}'),
('Mirtilli', 'fruit', 'berries', 57, 0.7, 14.5, 0.3, 2.4, 'na', '{"blueberries","mirtilli"}'),
('Lamponi', 'fruit', 'berries', 52, 1.2, 12.0, 0.7, 6.5, 'na', '{"raspberries","lamponi"}'),
('Kiwi', 'fruit', 'common', 61, 1.1, 14.7, 0.5, 3.0, 'na', '{"kiwi","kiwi verde"}'),
('Pera', 'fruit', 'common', 57, 0.4, 15.2, 0.1, 3.1, 'na', '{"pear","pera"}'),
('Uva', 'fruit', 'common', 69, 0.7, 18.1, 0.2, 0.9, 'na', '{"grapes","uva"}'),
('Pesca', 'fruit', 'common', 39, 0.9, 9.5, 0.3, 1.5, 'na', '{"peach","pesca"}'),
('Ananas', 'fruit', 'common', 50, 0.5, 13.1, 0.1, 1.4, 'na', '{"pineapple","ananas"}'),
('Anguria', 'fruit', 'common', 30, 0.6, 7.6, 0.2, 0.4, 'na', '{"watermelon","anguria","cocomero"}'),
('Melone', 'fruit', 'common', 34, 0.8, 8.2, 0.2, 0.9, 'na', '{"melon","cantalupo"}'),
('Mango', 'fruit', 'common', 60, 0.8, 15.0, 0.4, 1.6, 'na', '{"mango"}'),
('Datteri (secchi)', 'fruit', 'dried', 277, 1.8, 75.0, 0.2, 7.0, 'na', '{"dates","datteri","medjool"}'),
('Uvetta', 'fruit', 'dried', 299, 3.1, 79.2, 0.5, 3.7, 'na', '{"raisins","uvetta","uvetta sultanina"}'),
('Fichi secchi', 'fruit', 'dried', 249, 3.3, 63.9, 0.9, 9.8, 'na', '{"dried figs","fichi secchi"}'),
('Cocco grattugiato', 'fruit', 'dried', 660, 6.0, 24.0, 62.0, 16.0, 'na', '{"coconut flakes","cocco"}'),

-- VEGETABLES (meaningful calories or high logging relevance)
('Patate (crude)', 'vegetables', 'tubers', 77, 2.0, 17.5, 0.1, 1.8, 'raw', '{"potatoes","patata"}'),
('Mais dolce (in scatola)', 'vegetables', 'starchy', 86, 3.3, 19.0, 1.2, 2.0, 'na', '{"corn","mais","sweet corn"}'),
('Zucca', 'vegetables', 'starchy', 26, 1.0, 6.5, 0.1, 0.5, 'raw', '{"pumpkin","zucca"}'),
('Carote', 'vegetables', 'root', 41, 0.9, 10.0, 0.2, 2.8, 'raw', '{"carrots","carote"}'),
('Barbabietola', 'vegetables', 'root', 43, 1.6, 10.0, 0.2, 2.8, 'raw', '{"beetroot","barbabietola"}'),
('Pomodori', 'vegetables', 'common', 18, 0.9, 3.9, 0.2, 1.2, 'raw', '{"tomato","pomodoro","pomodori"}'),
('Broccoli', 'vegetables', 'common', 34, 2.8, 6.6, 0.4, 2.6, 'raw', '{"broccoli","broccolo"}'),
('Spinaci', 'vegetables', 'common', 23, 2.9, 3.6, 0.4, 2.2, 'raw', '{"spinach","spinaci"}'),
('Zucchine', 'vegetables', 'common', 17, 1.2, 3.1, 0.3, 1.0, 'raw', '{"zucchini","zucchine"}'),
('Peperoni', 'vegetables', 'common', 20, 0.9, 4.6, 0.2, 1.7, 'raw', '{"bell pepper","peperoni","peppers"}'),
('Melanzane', 'vegetables', 'common', 25, 1.0, 5.9, 0.2, 3.0, 'raw', '{"eggplant","melanzana"}'),
('Insalata / Lattuga', 'vegetables', 'common', 15, 1.4, 2.9, 0.2, 1.3, 'raw', '{"lettuce","insalata","iceberg"}'),
('Funghi champignon', 'vegetables', 'common', 22, 3.1, 3.3, 0.3, 1.0, 'raw', '{"mushrooms","funghi","champignon"}'),
('Cipolla', 'vegetables', 'common', 40, 1.1, 9.3, 0.1, 1.7, 'raw', '{"onion","cipolla"}'),
('Cavolfiore', 'vegetables', 'common', 25, 1.9, 5.0, 0.3, 2.0, 'raw', '{"cauliflower","cavolfiore"}'),

-- SWEETS & SNACKS
('Pizza Margherita (media da pizzeria)', 'sweets', 'pizza', 266, 11.0, 33.0, 10.0, 1.5, 'cooked', '{"pizza","margherita","pizza al taglio"}'),
('Cioccolato fondente (85%)', 'sweets', 'chocolate', 598, 8.8, 19.3, 51.6, 11.0, 'na', '{"dark chocolate","cioccolato fondente"}'),
('Cioccolato fondente (70%)', 'sweets', 'chocolate', 530, 7.0, 36.0, 41.0, 8.0, 'na', '{"cioccolato 70","dark chocolate 70"}'),
('Cioccolato al latte', 'sweets', 'chocolate', 535, 7.6, 59.4, 30.0, 3.4, 'na', '{"milk chocolate","cioccolato latte","kinder"}'),
('Gelato artigianale (media creme)', 'sweets', 'ice_cream', 200, 3.5, 24.0, 10.0, 0.5, 'na', '{"gelato","ice cream","gelato artigianale"}'),
('Gelato artigianale (media frutta)', 'sweets', 'ice_cream', 130, 1.5, 24.0, 3.0, 0.5, 'na', '{"sorbetto","fruit gelato"}'),
('Cornetto vuoto (da bar)', 'sweets', 'pastry', 410, 8.0, 50.0, 20.0, 1.5, 'na', '{"croissant","brioche","cornetto"}'),
('Cornetto con crema', 'sweets', 'pastry', 350, 7.0, 44.0, 16.0, 1.0, 'na', '{"cornetto crema","cream croissant"}'),
('Panino Hamburger (Fast Food)', 'sweets', 'fast_food', 254, 12.0, 31.0, 9.0, 1.5, 'cooked', '{"burger","hamburger","mcdonalds"}'),
('Patatine fritte', 'sweets', 'fast_food', 312, 3.4, 41.0, 15.0, 3.8, 'cooked', '{"french fries","patatine","fries"}'),
('Marmellata / Confettura', 'sweets', 'spreads', 250, 0.6, 60.0, 0.1, 1.0, 'na', '{"jam","marmellata","confettura"}'),
('Miele', 'sweets', 'spreads', 304, 0.3, 82.0, 0.0, 0, 'na', '{"honey","miele"}'),
('Biscotti secchi', 'sweets', 'cookies', 440, 7.0, 67.0, 16.0, 2.5, 'na', '{"biscuits","cookies","biscotti"}'),
('Biscotti frollini', 'sweets', 'cookies', 480, 6.0, 63.0, 22.0, 2.0, 'na', '{"frollini","shortbread cookies"}'),
('Cereali da colazione (corn flakes)', 'sweets', 'cereal', 357, 7.0, 84.0, 0.9, 3.0, 'na', '{"corn flakes","cereali colazione","cereal"}'),
('Granola classica', 'sweets', 'cereal', 471, 10.0, 64.0, 20.0, 5.0, 'na', '{"granola","muesli croccante"}'),
('Tiramisù', 'sweets', 'desserts', 283, 6.0, 24.0, 18.0, 0.5, 'na', '{"tiramisu","tiramisù"}'),
('Torta di mele', 'sweets', 'desserts', 237, 3.0, 30.0, 12.0, 1.0, 'na', '{"apple cake","torta mele"}'),

-- CALORIC BEVERAGES
('Succo d''arancia', 'beverages', 'juice', 45, 0.7, 10.4, 0.2, 0.2, 'na', '{"orange juice","succo arancia"}'),
('Succo di mela', 'beverages', 'juice', 46, 0.1, 11.3, 0.1, 0.2, 'na', '{"apple juice","succo mela"}'),
('Coca-Cola', 'beverages', 'soda', 42, 0.0, 10.6, 0.0, 0, 'na', '{"coca cola","cola","coke"}'),
('Sprite / Limonata', 'beverages', 'soda', 40, 0.0, 10.2, 0.0, 0, 'na', '{"sprite","limonata","lemonade","fanta"}'),
('Birra (media 5%)', 'beverages', 'alcohol', 43, 0.5, 3.5, 0.0, 0, 'na', '{"beer","birra"}'),
('Vino rosso', 'beverages', 'alcohol', 83, 0.1, 2.6, 0.0, 0, 'na', '{"red wine","vino rosso","vino"}'),
('Vino bianco', 'beverages', 'alcohol', 82, 0.1, 2.6, 0.0, 0, 'na', '{"white wine","vino bianco"}'),

-- FITNESS FOODS & SUPPLEMENTS
('Proteine del Siero (Whey)', 'fitness', 'supplement', 375, 78.0, 5.0, 4.5, 0, 'na', '{"whey","whey protein","proteine polvere","polvere proteica"}'),
('Proteine della Caseina', 'fitness', 'supplement', 360, 80.0, 4.0, 1.5, 0, 'na', '{"casein","caseina","casein protein"}'),
('Proteine Vegane (pisello/riso)', 'fitness', 'supplement', 370, 75.0, 8.0, 5.0, 3.0, 'na', '{"vegan protein","proteine vegane"}'),
('Barretta Proteica (generica)', 'fitness', 'bars', 360, 33.0, 35.0, 12.0, 3.0, 'na', '{"protein bar","barretta proteica","barretta"}'),
('Pancake proteici (mix secco)', 'fitness', 'prepared', 350, 35.0, 40.0, 5.0, 3.0, 'na', '{"protein pancake","pancake proteici"}'),
('Crema di riso (per sportivi)', 'fitness', 'prepared', 356, 7.0, 80.0, 1.0, 0.5, 'na', '{"cream of rice","crema di riso"}'),
('Burro di arachidi proteico', 'fitness', 'nut_butter', 450, 35.0, 15.0, 28.0, 5.0, 'na', '{"protein peanut butter","pb proteico"}'),
('Wafer proteici', 'fitness', 'bars', 380, 30.0, 30.0, 15.0, 2.0, 'na', '{"protein wafer","wafer proteico"}'),

-- SAUCES & CONDIMENTS
('Passata di pomodoro', 'vegetables', 'sauce', 24, 1.3, 4.2, 0.1, 1.0, 'na', '{"tomato sauce","passata","sugo pomodoro"}'),
('Pesto alla genovese', 'fats', 'sauce', 435, 5.0, 5.0, 43.0, 2.0, 'na', '{"pesto","basil pesto"}'),
('Salsa di soia', 'beverages', 'sauce', 53, 5.0, 5.0, 0.1, 0, 'na', '{"soy sauce","salsa soia","tamari"}'),
('Aceto balsamico', 'beverages', 'condiment', 88, 0.5, 17.0, 0.0, 0, 'na', '{"balsamic vinegar","aceto balsamico"}'),
('Ketchup', 'sweets', 'sauce', 112, 1.0, 26.0, 0.2, 0.3, 'na', '{"ketchup"}'),
('Senape', 'fats', 'condiment', 66, 4.0, 6.0, 3.0, 3.0, 'na', '{"mustard","senape"}')
ON CONFLICT DO NOTHING;
