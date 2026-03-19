-- ============================================================
-- CSV TEAM — FOOD DATABASE EXPANSION (Phase 7)
-- Adds 150+ commonly spoken Italian foods for AI voice matching
-- ============================================================

INSERT INTO food_items (name, category, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, is_core, verified, serving_type) VALUES

-- ═══════════════════════════════════════════
-- PIZZE & FOCACCE
-- ═══════════════════════════════════════════
('Pizza bianca (romana)', 'sweets', 280, 8.0, 40.0, 9.0, true, true, 'g'),
('Pizza rossa (marinara)', 'sweets', 245, 7.0, 38.0, 6.5, true, true, 'g'),
('Pizza con patate', 'sweets', 260, 6.5, 38.0, 8.5, true, true, 'g'),
('Pizza al taglio (media)', 'sweets', 270, 8.5, 36.0, 10.0, true, true, 'g'),
('Pizza quattro formaggi', 'sweets', 300, 12.0, 30.0, 15.0, true, true, 'g'),
('Pizza capricciosa', 'sweets', 260, 10.0, 32.0, 10.0, true, true, 'g'),
('Pizza diavola / salamino piccante', 'sweets', 275, 11.0, 30.0, 12.5, true, true, 'g'),
('Pizza prosciutto e funghi', 'sweets', 250, 11.0, 32.0, 9.0, true, true, 'g'),
('Pizza tonno e cipolla', 'sweets', 240, 12.0, 30.0, 8.0, true, true, 'g'),
('Calzone ripieno', 'sweets', 265, 10.5, 32.0, 10.5, true, true, 'g'),
('Focaccia farcita', 'sweets', 290, 8.0, 35.0, 13.0, true, true, 'g'),
('Pinsa romana', 'sweets', 250, 9.0, 35.0, 8.0, true, true, 'g'),

-- ═══════════════════════════════════════════
-- PRIMI PIATTI / PASTE CONDITE
-- ═══════════════════════════════════════════
('Pasta al pomodoro (cotta e condita)', 'carbs', 160, 5.5, 28.0, 3.0, true, true, 'g'),
('Pasta alla carbonara (cotta e condita)', 'carbs', 190, 9.0, 22.0, 8.0, true, true, 'g'),
('Pasta al pesto (cotta e condita)', 'carbs', 185, 6.5, 24.0, 7.5, true, true, 'g'),
('Pasta alla bolognese / ragù (cotta)', 'carbs', 175, 8.0, 22.0, 6.5, true, true, 'g'),
('Pasta all''amatriciana (cotta)', 'carbs', 180, 7.5, 23.0, 7.0, true, true, 'g'),
('Pasta cacio e pepe (cotta)', 'carbs', 195, 8.0, 24.0, 8.0, true, true, 'g'),
('Pasta aglio olio e peperoncino (cotta)', 'carbs', 170, 5.0, 26.0, 5.5, true, true, 'g'),
('Pasta al tonno (cotta)', 'carbs', 165, 8.5, 23.0, 4.5, true, true, 'g'),
('Lasagna alla bolognese', 'carbs', 185, 9.5, 18.0, 9.0, true, true, 'g'),
('Gnocchi di patate (cotti)', 'carbs', 135, 3.0, 28.0, 1.0, true, true, 'g'),
('Gnocchi al pomodoro', 'carbs', 145, 3.5, 26.0, 3.0, true, true, 'g'),
('Ravioli ricotta e spinaci (cotti)', 'carbs', 170, 7.0, 22.0, 6.0, true, true, 'g'),
('Tortellini in brodo', 'carbs', 155, 7.0, 20.0, 5.0, true, true, 'g'),
('Risotto (media, pronto)', 'carbs', 160, 4.5, 26.0, 4.0, true, true, 'g'),
('Risotto ai funghi', 'carbs', 155, 4.0, 25.0, 4.5, true, true, 'g'),
('Riso in bianco (condito con olio)', 'carbs', 150, 3.0, 28.0, 3.0, true, true, 'g'),
('Polenta (cotta)', 'carbs', 85, 2.0, 18.0, 0.5, true, true, 'g'),
('Minestrone di verdure', 'carbs', 50, 2.0, 8.0, 1.0, true, true, 'g'),
('Zuppa di legumi', 'carbs', 90, 5.5, 13.0, 1.5, true, true, 'g'),
('Pasta e fagioli', 'carbs', 120, 6.0, 18.0, 2.5, true, true, 'g'),

-- ═══════════════════════════════════════════
-- PANE, PANINI & STREET FOOD
-- ═══════════════════════════════════════════
('Panino (vuoto, rosetta)', 'carbs', 280, 9.0, 52.0, 3.5, true, true, 'g'),
('Panino con prosciutto e mozzarella', 'sweets', 250, 13.0, 28.0, 10.0, true, true, 'g'),
('Panino con salame', 'sweets', 310, 12.0, 28.0, 16.0, true, true, 'g'),
('Panino con tonno e pomodoro', 'sweets', 220, 12.0, 28.0, 6.0, true, true, 'g'),
('Toast prosciutto e formaggio', 'sweets', 265, 13.0, 25.0, 12.5, true, true, 'g'),
('Tramezzino (media)', 'sweets', 230, 8.5, 22.0, 12.0, true, true, 'g'),
('Kebab (carne e pane)', 'sweets', 215, 14.0, 20.0, 9.0, true, true, 'g'),
('Piadina con crudo e squacquerone', 'sweets', 290, 12.0, 30.0, 13.0, true, true, 'g'),
('Arancina / Arancino', 'sweets', 230, 6.0, 28.0, 10.0, true, true, 'g'),
('Supplì al telefono', 'sweets', 245, 7.0, 26.0, 12.0, true, true, 'g'),
('Crocchè / Crocchetta di patate', 'sweets', 210, 5.0, 24.0, 10.0, true, true, 'g'),

-- ═══════════════════════════════════════════
-- SECONDI / PIATTI PRONTI
-- ═══════════════════════════════════════════
('Cotoletta di pollo impanata', 'lean_protein', 220, 18.0, 12.0, 11.0, true, true, 'g'),
('Cotoletta alla milanese (vitello)', 'lean_protein', 250, 17.0, 10.0, 16.0, true, true, 'g'),
('Hamburger (solo carne)', 'fatty_protein', 250, 17.0, 0.5, 20.0, true, true, 'g'),
('Polpette di carne (cotte)', 'fatty_protein', 220, 14.0, 8.0, 14.0, true, true, 'g'),
('Scaloppina al limone', 'lean_protein', 165, 22.0, 3.0, 7.0, true, true, 'g'),
('Tagliata di manzo', 'lean_protein', 175, 26.0, 0.0, 8.0, true, true, 'g'),
('Fettina di vitello ai ferri', 'lean_protein', 145, 25.0, 0.0, 5.0, true, true, 'g'),
('Fettina di manzo ai ferri', 'lean_protein', 160, 26.0, 0.0, 6.5, true, true, 'g'),
('Pollo arrosto (con pelle)', 'fatty_protein', 215, 25.0, 0.0, 13.0, true, true, 'g'),
('Pollo arrosto (senza pelle)', 'lean_protein', 165, 28.0, 0.0, 5.5, true, true, 'g'),
('Bistecca di maiale', 'lean_protein', 175, 24.0, 0.0, 9.0, true, true, 'g'),
('Involtini di carne', 'fatty_protein', 200, 16.0, 5.0, 13.0, true, true, 'g'),
('Frittata (2 uova)', 'fatty_protein', 180, 12.0, 1.0, 14.0, true, true, 'g'),
('Uova strapazzate', 'fatty_protein', 170, 11.0, 1.5, 13.0, true, true, 'g'),
('Uovo sodo', 'fatty_protein', 155, 13.0, 1.0, 11.0, true, true, 'g'),
('Uovo alla coque', 'fatty_protein', 155, 13.0, 1.0, 11.0, true, true, 'g'),
('Bastoncini di pesce (surgelati, cotti)', 'lean_protein', 200, 12.0, 18.0, 9.0, true, true, 'g'),
('Tonno in scatola al naturale', 'lean_protein', 110, 25.0, 0.0, 1.0, true, true, 'g'),

-- ═══════════════════════════════════════════
-- CONTORNI & VERDURE COTTE
-- ═══════════════════════════════════════════
('Insalata mista (condita)', 'vegetables', 50, 1.5, 3.0, 3.5, true, true, 'g'),
('Verdure grigliate (media)', 'vegetables', 55, 2.0, 5.0, 3.0, true, true, 'g'),
('Verdure al vapore', 'vegetables', 35, 2.0, 5.0, 0.5, true, true, 'g'),
('Patatine fritte (fatte in casa)', 'carbs', 290, 3.5, 35.0, 15.0, true, true, 'g'),
('Purè di patate', 'carbs', 100, 2.0, 14.0, 4.0, true, true, 'g'),
('Finocchio', 'vegetables', 31, 1.2, 7.0, 0.2, true, true, 'g'),
('Sedano', 'vegetables', 16, 0.7, 3.0, 0.2, true, true, 'g'),
('Rucola', 'vegetables', 25, 2.6, 3.7, 0.7, true, true, 'g'),
('Radicchio', 'vegetables', 23, 1.4, 4.5, 0.2, true, true, 'g'),
('Carciofi', 'vegetables', 47, 3.3, 11.0, 0.2, true, true, 'g'),
('Asparagi', 'vegetables', 20, 2.2, 3.9, 0.1, true, true, 'g'),
('Cetriolo', 'vegetables', 15, 0.7, 3.6, 0.1, true, true, 'g'),
('Olive verdi', 'fats', 145, 1.0, 3.8, 15.0, true, true, 'g'),
('Olive nere', 'fats', 115, 0.8, 6.0, 11.0, true, true, 'g'),

-- ═══════════════════════════════════════════
-- SALSE & CONDIMENTI
-- ═══════════════════════════════════════════
('Salsa tonnata', 'fats', 200, 8.0, 2.0, 18.0, true, true, 'g'),
('Besciamella', 'fats', 120, 3.5, 8.0, 8.5, true, true, 'g'),
('Ragù di carne (sugo)', 'fats', 90, 6.0, 4.0, 5.5, true, true, 'g'),
('Sugo al pomodoro (pronto)', 'vegetables', 55, 1.5, 7.0, 2.0, true, true, 'g'),
('Pesto rosso', 'fats', 250, 4.0, 10.0, 22.0, true, true, 'g'),
('Guacamole', 'fats', 160, 2.0, 8.5, 14.0, true, true, 'g'),

-- ═══════════════════════════════════════════
-- COLAZIONE & DOLCI
-- ═══════════════════════════════════════════
('Cornetto integrale', 'sweets', 340, 7.5, 48.0, 13.0, true, true, 'g'),
('Cornetto al cioccolato', 'sweets', 400, 7.0, 50.0, 19.0, true, true, 'g'),
('Brioche siciliana', 'sweets', 360, 7.0, 50.0, 14.0, true, true, 'g'),
('Crostata alla marmellata', 'sweets', 370, 5.5, 55.0, 15.0, true, true, 'g'),
('Cannolo siciliano', 'sweets', 340, 6.0, 40.0, 18.0, true, true, 'g'),
('Ciambella (donut)', 'sweets', 400, 5.0, 50.0, 20.0, true, true, 'g'),
('Croissant / Sfoglia', 'sweets', 400, 7.0, 45.0, 22.0, true, true, 'g'),
('Plumcake', 'sweets', 380, 5.0, 50.0, 18.0, true, true, 'g'),
('Pancake (1 pezzo, classico)', 'sweets', 230, 6.5, 30.0, 9.0, true, true, 'g'),
('Waffle', 'sweets', 310, 7.0, 35.0, 15.0, true, true, 'g'),
('Crepe (vuota)', 'sweets', 200, 6.0, 25.0, 8.0, true, true, 'g'),
('Crepe alla Nutella', 'sweets', 310, 5.5, 42.0, 14.0, true, true, 'g'),
('Torta al cioccolato', 'sweets', 380, 5.0, 48.0, 19.0, true, true, 'g'),
('Panna cotta', 'sweets', 220, 3.0, 20.0, 14.0, true, true, 'g'),
('Budino al cioccolato', 'sweets', 150, 3.5, 22.0, 5.5, true, true, 'g'),
('Gelato confezionato (cono / stecco)', 'sweets', 260, 4.0, 32.0, 13.0, true, true, 'g'),
('Nutella / crema spalmabile', 'sweets', 540, 6.0, 56.0, 31.0, true, true, 'g'),

-- ═══════════════════════════════════════════
-- SNACK & VARI
-- ═══════════════════════════════════════════
('Patatine in sacchetto (chips)', 'sweets', 540, 5.5, 50.0, 35.0, true, true, 'g'),
('Popcorn (senza burro)', 'carbs', 380, 12.0, 65.0, 5.0, true, true, 'g'),
('Barretta ai cereali', 'sweets', 400, 6.0, 65.0, 14.0, true, true, 'g'),
('Frutta secca mista', 'nuts', 600, 18.0, 16.0, 52.0, true, true, 'g'),
('Cioccolatino / Praline', 'sweets', 520, 6.0, 52.0, 32.0, true, true, 'g'),
('Merendina confezionata', 'sweets', 410, 5.5, 55.0, 19.0, true, true, 'g'),

-- ═══════════════════════════════════════════
-- BEVANDE & LIQUIDI
-- ═══════════════════════════════════════════
('Caffè espresso (senza zucchero)', 'beverages', 2, 0.1, 0.0, 0.0, true, true, 'ml'),
('Caffè macchiato', 'beverages', 10, 0.5, 0.8, 0.4, true, true, 'ml'),
('Cappuccino', 'beverages', 45, 2.5, 4.0, 2.0, true, true, 'ml'),
('Latte macchiato', 'beverages', 50, 2.8, 4.5, 2.0, true, true, 'ml'),
('Tè (senza zucchero)', 'beverages', 1, 0.0, 0.3, 0.0, true, true, 'ml'),
('Acqua tonica', 'beverages', 34, 0.0, 8.5, 0.0, true, true, 'ml'),
('Energy drink (Red Bull ecc.)', 'beverages', 46, 0.0, 11.0, 0.0, true, true, 'ml'),
('Smoothie alla frutta', 'beverages', 55, 0.8, 12.0, 0.3, true, true, 'ml'),
('Centrifuga / Estratto di frutta', 'beverages', 45, 0.5, 10.0, 0.2, true, true, 'ml'),
('Frullato proteico (con latte)', 'beverages', 80, 10.0, 8.0, 1.5, true, true, 'ml'),
('Spremuta d''arancia (fresca)', 'beverages', 45, 0.7, 10.0, 0.2, true, true, 'ml'),
('Birra analcolica', 'beverages', 25, 0.3, 5.5, 0.0, true, true, 'ml'),

-- ═══════════════════════════════════════════
-- CEREALI & COLAZIONE
-- ═══════════════════════════════════════════
('Muesli', 'carbs', 370, 10.0, 60.0, 8.0, true, true, 'g'),
('Porridge di avena (cotto con acqua)', 'carbs', 70, 2.5, 12.0, 1.5, true, true, 'g'),
('Porridge di avena (cotto con latte)', 'carbs', 100, 4.0, 14.0, 3.0, true, true, 'g'),
('Pane tostato / Bruschetta', 'carbs', 290, 9.0, 54.0, 4.0, true, true, 'g'),

-- ═══════════════════════════════════════════
-- FRUTTA FRESCA AGGIUNTIVA
-- ═══════════════════════════════════════════
('Albicocca', 'fruit', 48, 1.4, 11.0, 0.4, true, true, 'g'),
('Ciliegie', 'fruit', 63, 1.1, 16.0, 0.2, true, true, 'g'),
('Prugne', 'fruit', 46, 0.7, 11.4, 0.3, true, true, 'g'),
('Pompelmo', 'fruit', 42, 0.8, 11.0, 0.1, true, true, 'g'),
('Melograno', 'fruit', 83, 1.7, 19.0, 1.2, true, true, 'g'),
('Lime', 'fruit', 30, 0.7, 11.0, 0.2, true, true, 'g'),
('Limone', 'fruit', 29, 1.1, 9.3, 0.3, true, true, 'g'),
('Papaya', 'fruit', 43, 0.5, 11.0, 0.3, true, true, 'g'),
('Frutto della passione', 'fruit', 97, 2.2, 23.0, 0.7, true, true, 'g'),
('Frutti di bosco (misti)', 'fruit', 45, 1.0, 10.0, 0.3, true, true, 'g'),

-- ═══════════════════════════════════════════
-- LATTICINI AGGIUNTIVI
-- ═══════════════════════════════════════════
('Burrata', 'dairy', 290, 11.0, 1.0, 27.0, true, true, 'g'),
('Provola / Provolone', 'dairy', 350, 26.0, 2.0, 27.0, true, true, 'g'),
('Fontina', 'dairy', 390, 25.0, 0.8, 32.0, true, true, 'g'),
('Taleggio', 'dairy', 315, 19.0, 0.7, 26.0, true, true, 'g'),
('Crescenza', 'dairy', 280, 16.0, 1.5, 23.0, true, true, 'g'),
('Primo sale', 'dairy', 270, 18.0, 0.5, 22.0, true, true, 'g'),
('Caciotta', 'dairy', 340, 22.0, 0.5, 28.0, true, true, 'g'),

-- ═══════════════════════════════════════════
-- AFFETTATI / SALUMI AGGIUNTIVI
-- ═══════════════════════════════════════════
('Prosciutto cotto a cubetti', 'fatty_protein', 140, 18.0, 1.0, 7.0, true, true, 'g'),
('Bresaola di tacchino', 'lean_protein', 120, 24.0, 0.5, 2.0, true, true, 'g'),
('Cotechino (cotto)', 'fatty_protein', 310, 15.0, 1.0, 27.0, true, true, 'g'),
('Guanciale', 'fatty_protein', 650, 7.0, 0.0, 69.0, true, true, 'g'),
('Lardo', 'fats', 890, 1.5, 0.0, 99.0, true, true, 'g'),

-- ═══════════════════════════════════════════
-- PESCE AGGIUNTIVO
-- ═══════════════════════════════════════════
('Seppia', 'lean_protein', 80, 16.0, 0.8, 1.5, true, true, 'g'),
('Baccalà (merluzzo salato, ammollato)', 'lean_protein', 95, 22.0, 0.0, 0.7, true, true, 'g'),
('Platessa / Sogliola (filetto)', 'lean_protein', 85, 18.0, 0.0, 1.2, true, true, 'g'),
('Sushi (nigiri misto, media)', 'lean_protein', 145, 7.0, 22.0, 3.0, true, true, 'g'),
('Sashimi (salmone)', 'lean_protein', 140, 20.0, 0.0, 6.5, true, true, 'g'),

-- ═══════════════════════════════════════════
-- LEGUMI & PROTEINE VEGETALI
-- ═══════════════════════════════════════════
('Tempeh', 'lean_protein', 195, 20.0, 10.0, 11.0, true, true, 'g'),
('Seitan', 'lean_protein', 135, 25.0, 5.0, 2.0, true, true, 'g'),
('Falafel (cotti)', 'carbs', 330, 13.0, 35.0, 18.0, true, true, 'g'),
('Burger vegetale (patty)', 'lean_protein', 190, 16.0, 10.0, 10.0, true, true, 'g'),
('Fagioli neri (cotti)', 'carbs', 130, 8.5, 23.0, 0.5, true, true, 'g'),
('Lupini', 'lean_protein', 115, 16.0, 10.0, 3.0, true, true, 'g'),

-- ═══════════════════════════════════════════
-- ZUCCHERI & DOLCIFICANTI
-- ═══════════════════════════════════════════
('Zucchero bianco', 'sweets', 400, 0.0, 100.0, 0.0, true, true, 'g'),
('Zucchero di canna', 'sweets', 395, 0.0, 98.0, 0.0, true, true, 'g'),
('Sciroppo d''acero', 'sweets', 260, 0.0, 67.0, 0.0, true, true, 'g')

ON CONFLICT DO NOTHING;
