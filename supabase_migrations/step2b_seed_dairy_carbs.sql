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
