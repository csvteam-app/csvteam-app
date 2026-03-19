-- ============================================================
-- CSV TEAM: LIBRERIA ESERCIZI COMPLETA BODYBUILDING
-- Esegui in Supabase SQL Editor
-- ============================================================

-- Prima svuota la tabella se vuoi ripartire da zero (opzionale, commentato)
-- DELETE FROM exercises WHERE id IS NOT NULL;

INSERT INTO exercises (name, primary_muscle_group, equipment_category, tags) VALUES

-- ═══════════════════════════════════════════
-- PETTO (chest)
-- ═══════════════════════════════════════════
('Panca Piana con Bilanciere', 'chest', 'barbell', ARRAY['bilanciere', 'compound', 'petto']),
('Panca Piana con Manubri', 'chest', 'dumbbell', ARRAY['manubri', 'compound', 'petto']),
('Panca Inclinata con Bilanciere', 'chest', 'barbell', ARRAY['bilanciere', 'compound', 'petto alto']),
('Panca Inclinata con Manubri', 'chest', 'dumbbell', ARRAY['manubri', 'compound', 'petto alto']),
('Panca Declinata con Bilanciere', 'chest', 'barbell', ARRAY['bilanciere', 'compound', 'petto basso']),
('Panca Declinata con Manubri', 'chest', 'dumbbell', ARRAY['manubri', 'compound', 'petto basso']),
('Croci con Manubri su Panca Piana', 'chest', 'dumbbell', ARRAY['manubri', 'isolamento', 'petto']),
('Croci con Manubri su Panca Inclinata', 'chest', 'dumbbell', ARRAY['manubri', 'isolamento', 'petto alto']),
('Croci ai Cavi Alti', 'chest', 'cable_machine', ARRAY['cavi', 'isolamento', 'petto basso']),
('Croci ai Cavi Bassi', 'chest', 'cable_machine', ARRAY['cavi', 'isolamento', 'petto alto']),
('Croci ai Cavi Medi', 'chest', 'cable_machine', ARRAY['cavi', 'isolamento', 'petto']),
('Chest Press alla Macchina', 'chest', 'machine', ARRAY['macchina', 'compound', 'petto']),
('Pectoral Machine', 'chest', 'machine', ARRAY['macchina', 'isolamento', 'petto']),
('Dips alle Parallele (Petto)', 'chest', 'bodyweight', ARRAY['corpo libero', 'compound', 'petto']),
('Push Up (Piegamenti)', 'chest', 'bodyweight', ARRAY['corpo libero', 'compound', 'petto']),
('Floor Press con Manubri', 'chest', 'dumbbell', ARRAY['manubri', 'compound', 'petto']),
('Pullover con Manubrio', 'chest', 'dumbbell', ARRAY['manubri', 'isolamento', 'petto', 'dorsali']),
('Panca Piana alla Smith Machine', 'chest', 'machine', ARRAY['smith', 'compound', 'petto']),

-- ═══════════════════════════════════════════
-- SCHIENA (back)
-- ═══════════════════════════════════════════
('Trazioni alla Sbarra (Pull Up)', 'back', 'bodyweight', ARRAY['corpo libero', 'compound', 'dorsali']),
('Trazioni Presa Supina (Chin Up)', 'back', 'bodyweight', ARRAY['corpo libero', 'compound', 'dorsali', 'bicipiti']),
('Trazioni Presa Neutra', 'back', 'bodyweight', ARRAY['corpo libero', 'compound', 'dorsali']),
('Trazioni Zavorrate', 'back', 'bodyweight', ARRAY['corpo libero', 'compound', 'dorsali', 'zavorra']),
('Lat Machine Avanti', 'back', 'cable_machine', ARRAY['cavi', 'compound', 'dorsali']),
('Lat Machine Presa Stretta', 'back', 'cable_machine', ARRAY['cavi', 'compound', 'dorsali']),
('Lat Machine Presa Supina', 'back', 'cable_machine', ARRAY['cavi', 'compound', 'dorsali']),
('Rematore con Bilanciere (Barbell Row)', 'back', 'barbell', ARRAY['bilanciere', 'compound', 'dorsali']),
('Rematore con Manubrio', 'back', 'dumbbell', ARRAY['manubri', 'compound', 'dorsali']),
('Rematore con Manubrio su Panca', 'back', 'dumbbell', ARRAY['manubri', 'compound', 'dorsali']),
('Rematore al Cavo Basso (Pulley)', 'back', 'cable_machine', ARRAY['cavi', 'compound', 'dorsali']),
('Rematore con T-Bar', 'back', 'barbell', ARRAY['bilanciere', 'compound', 'dorsali']),
('Rematore alla Macchina', 'back', 'machine', ARRAY['macchina', 'compound', 'dorsali']),
('Stacco da Terra (Deadlift)', 'back', 'barbell', ARRAY['bilanciere', 'compound', 'dorsali', 'gambe']),
('Pulldown al Cavo con Braccia Tese', 'back', 'cable_machine', ARRAY['cavi', 'isolamento', 'dorsali']),
('Seal Row', 'back', 'barbell', ARRAY['bilanciere', 'compound', 'dorsali']),
('Meadows Row', 'back', 'barbell', ARRAY['bilanciere', 'compound', 'dorsali']),
('Pullover alla Macchina', 'back', 'machine', ARRAY['macchina', 'isolamento', 'dorsali']),
('Hyperextension (Iperestensioni)', 'back', 'bodyweight', ARRAY['corpo libero', 'isolamento', 'lombari']),

-- ═══════════════════════════════════════════
-- SPALLE (shoulders)
-- ═══════════════════════════════════════════
('Lento Avanti con Bilanciere (OHP)', 'shoulders', 'barbell', ARRAY['bilanciere', 'compound', 'spalle']),
('Lento Avanti con Manubri', 'shoulders', 'dumbbell', ARRAY['manubri', 'compound', 'spalle']),
('Arnold Press', 'shoulders', 'dumbbell', ARRAY['manubri', 'compound', 'spalle']),
('Military Press', 'shoulders', 'barbell', ARRAY['bilanciere', 'compound', 'spalle']),
('Shoulder Press alla Macchina', 'shoulders', 'machine', ARRAY['macchina', 'compound', 'spalle']),
('Alzate Laterali con Manubri', 'shoulders', 'dumbbell', ARRAY['manubri', 'isolamento', 'deltoide laterale']),
('Alzate Laterali al Cavo', 'shoulders', 'cable_machine', ARRAY['cavi', 'isolamento', 'deltoide laterale']),
('Alzate Laterali alla Macchina', 'shoulders', 'machine', ARRAY['macchina', 'isolamento', 'deltoide laterale']),
('Alzate Frontali con Manubri', 'shoulders', 'dumbbell', ARRAY['manubri', 'isolamento', 'deltoide anteriore']),
('Alzate Frontali al Cavo', 'shoulders', 'cable_machine', ARRAY['cavi', 'isolamento', 'deltoide anteriore']),
('Alzate Posteriori con Manubri (Reverse Fly)', 'shoulders', 'dumbbell', ARRAY['manubri', 'isolamento', 'deltoide posteriore']),
('Alzate Posteriori al Cavo', 'shoulders', 'cable_machine', ARRAY['cavi', 'isolamento', 'deltoide posteriore']),
('Alzate Posteriori alla Macchina (Rear Delt Machine)', 'shoulders', 'machine', ARRAY['macchina', 'isolamento', 'deltoide posteriore']),
('Face Pull al Cavo', 'shoulders', 'cable_machine', ARRAY['cavi', 'isolamento', 'deltoide posteriore', 'trapezio']),
('Tirate al Mento (Upright Row)', 'shoulders', 'barbell', ARRAY['bilanciere', 'compound', 'spalle', 'trapezio']),
('Shrug con Bilanciere', 'shoulders', 'barbell', ARRAY['bilanciere', 'isolamento', 'trapezio']),
('Shrug con Manubri', 'shoulders', 'dumbbell', ARRAY['manubri', 'isolamento', 'trapezio']),
('Lento Dietro alla Smith Machine', 'shoulders', 'machine', ARRAY['smith', 'compound', 'spalle']),
('Y Raise al Cavo', 'shoulders', 'cable_machine', ARRAY['cavi', 'isolamento', 'deltoide laterale']),

-- ═══════════════════════════════════════════
-- GAMBE (legs)
-- ═══════════════════════════════════════════
('Squat con Bilanciere (Back Squat)', 'legs', 'barbell', ARRAY['bilanciere', 'compound', 'quadricipiti']),
('Front Squat', 'legs', 'barbell', ARRAY['bilanciere', 'compound', 'quadricipiti']),
('Squat alla Smith Machine', 'legs', 'machine', ARRAY['smith', 'compound', 'quadricipiti']),
('Hack Squat alla Macchina', 'legs', 'machine', ARRAY['macchina', 'compound', 'quadricipiti']),
('Leg Press', 'legs', 'machine', ARRAY['macchina', 'compound', 'quadricipiti']),
('Leg Press 45 gradi', 'legs', 'machine', ARRAY['macchina', 'compound', 'quadricipiti']),
('Pendulum Squat', 'legs', 'machine', ARRAY['macchina', 'compound', 'quadricipiti']),
('Sissy Squat', 'legs', 'bodyweight', ARRAY['corpo libero', 'isolamento', 'quadricipiti']),
('Leg Extension', 'legs', 'machine', ARRAY['macchina', 'isolamento', 'quadricipiti']),
('Leg Curl Sdraiato', 'legs', 'machine', ARRAY['macchina', 'isolamento', 'femorali']),
('Leg Curl Seduto', 'legs', 'machine', ARRAY['macchina', 'isolamento', 'femorali']),
('Leg Curl in Piedi', 'legs', 'machine', ARRAY['macchina', 'isolamento', 'femorali']),
('Stacco Rumeno con Bilanciere', 'legs', 'barbell', ARRAY['bilanciere', 'compound', 'femorali', 'glutei']),
('Stacco Rumeno con Manubri', 'legs', 'dumbbell', ARRAY['manubri', 'compound', 'femorali', 'glutei']),
('Stacco a Gambe Tese', 'legs', 'barbell', ARRAY['bilanciere', 'compound', 'femorali']),
('Good Morning', 'legs', 'barbell', ARRAY['bilanciere', 'compound', 'femorali', 'lombari']),
('Affondi con Bilanciere', 'legs', 'barbell', ARRAY['bilanciere', 'compound', 'quadricipiti', 'glutei']),
('Affondi con Manubri', 'legs', 'dumbbell', ARRAY['manubri', 'compound', 'quadricipiti', 'glutei']),
('Affondi Camminati', 'legs', 'dumbbell', ARRAY['manubri', 'compound', 'quadricipiti', 'glutei']),
('Bulgarian Split Squat', 'legs', 'dumbbell', ARRAY['manubri', 'compound', 'quadricipiti', 'glutei']),
('Step Up con Manubri', 'legs', 'dumbbell', ARRAY['manubri', 'compound', 'quadricipiti']),
('Calf Raise alla Macchina (in piedi)', 'legs', 'machine', ARRAY['macchina', 'isolamento', 'polpacci']),
('Calf Raise Seduto', 'legs', 'machine', ARRAY['macchina', 'isolamento', 'polpacci']),
('Calf Raise alla Leg Press', 'legs', 'machine', ARRAY['macchina', 'isolamento', 'polpacci']),
('Adductor Machine', 'legs', 'machine', ARRAY['macchina', 'isolamento', 'adduttori']),
('Abductor Machine', 'legs', 'machine', ARRAY['macchina', 'isolamento', 'abduttori']),

-- ═══════════════════════════════════════════
-- BICIPITI (biceps)
-- ═══════════════════════════════════════════
('Curl con Bilanciere', 'biceps', 'barbell', ARRAY['bilanciere', 'isolamento', 'bicipiti']),
('Curl con Bilanciere EZ', 'biceps', 'barbell', ARRAY['bilanciere', 'isolamento', 'bicipiti']),
('Curl con Manubri', 'biceps', 'dumbbell', ARRAY['manubri', 'isolamento', 'bicipiti']),
('Curl Alternato con Manubri', 'biceps', 'dumbbell', ARRAY['manubri', 'isolamento', 'bicipiti']),
('Curl a Martello (Hammer Curl)', 'biceps', 'dumbbell', ARRAY['manubri', 'isolamento', 'bicipiti', 'brachiale']),
('Curl su Panca Inclinata', 'biceps', 'dumbbell', ARRAY['manubri', 'isolamento', 'bicipiti']),
('Curl di Concentrazione', 'biceps', 'dumbbell', ARRAY['manubri', 'isolamento', 'bicipiti']),
('Curl alla Panca Scott (Preacher Curl)', 'biceps', 'barbell', ARRAY['bilanciere', 'isolamento', 'bicipiti']),
('Curl al Cavo Basso', 'biceps', 'cable_machine', ARRAY['cavi', 'isolamento', 'bicipiti']),
('Curl al Cavo Alto (Doppio Bicipiti)', 'biceps', 'cable_machine', ARRAY['cavi', 'isolamento', 'bicipiti']),
('Curl alla Macchina', 'biceps', 'machine', ARRAY['macchina', 'isolamento', 'bicipiti']),
('Spider Curl', 'biceps', 'dumbbell', ARRAY['manubri', 'isolamento', 'bicipiti']),
('Curl con Corda al Cavo (Rope Hammer Curl)', 'biceps', 'cable_machine', ARRAY['cavi', 'isolamento', 'bicipiti', 'brachiale']),

-- ═══════════════════════════════════════════
-- TRICIPITI (triceps)
-- ═══════════════════════════════════════════
('Push Down ai Cavi con Barra', 'triceps', 'cable_machine', ARRAY['cavi', 'isolamento', 'tricipiti']),
('Push Down ai Cavi con Corda', 'triceps', 'cable_machine', ARRAY['cavi', 'isolamento', 'tricipiti']),
('Push Down ai Cavi Presa Inversa', 'triceps', 'cable_machine', ARRAY['cavi', 'isolamento', 'tricipiti']),
('French Press con Bilanciere (Skull Crusher)', 'triceps', 'barbell', ARRAY['bilanciere', 'isolamento', 'tricipiti']),
('French Press con Manubri', 'triceps', 'dumbbell', ARRAY['manubri', 'isolamento', 'tricipiti']),
('Estensioni Tricipiti al Cavo Alto (Overhead)', 'triceps', 'cable_machine', ARRAY['cavi', 'isolamento', 'tricipiti']),
('Estensioni Tricipiti con Manubrio sopra la Testa', 'triceps', 'dumbbell', ARRAY['manubri', 'isolamento', 'tricipiti']),
('Kick Back con Manubrio', 'triceps', 'dumbbell', ARRAY['manubri', 'isolamento', 'tricipiti']),
('Kick Back al Cavo', 'triceps', 'cable_machine', ARRAY['cavi', 'isolamento', 'tricipiti']),
('Dips alle Parallele (Tricipiti)', 'triceps', 'bodyweight', ARRAY['corpo libero', 'compound', 'tricipiti']),
('Dips tra le Panche (Bench Dips)', 'triceps', 'bodyweight', ARRAY['corpo libero', 'compound', 'tricipiti']),
('Panca Piana Presa Stretta', 'triceps', 'barbell', ARRAY['bilanciere', 'compound', 'tricipiti']),
('JM Press', 'triceps', 'barbell', ARRAY['bilanciere', 'isolamento', 'tricipiti']),

-- ═══════════════════════════════════════════
-- GLUTEI (glutes)
-- ═══════════════════════════════════════════
('Hip Thrust con Bilanciere', 'glutes', 'barbell', ARRAY['bilanciere', 'compound', 'glutei']),
('Hip Thrust alla Macchina', 'glutes', 'machine', ARRAY['macchina', 'compound', 'glutei']),
('Glute Bridge', 'glutes', 'bodyweight', ARRAY['corpo libero', 'isolamento', 'glutei']),
('Glute Bridge con Bilanciere', 'glutes', 'barbell', ARRAY['bilanciere', 'compound', 'glutei']),
('Kick Back al Cavo (Glutei)', 'glutes', 'cable_machine', ARRAY['cavi', 'isolamento', 'glutei']),
('Kick Back alla Macchina (Glutei)', 'glutes', 'machine', ARRAY['macchina', 'isolamento', 'glutei']),
('Sumo Squat', 'glutes', 'dumbbell', ARRAY['manubri', 'compound', 'glutei', 'adduttori']),
('Sumo Deadlift', 'glutes', 'barbell', ARRAY['bilanciere', 'compound', 'glutei']),
('Frog Pump', 'glutes', 'bodyweight', ARRAY['corpo libero', 'isolamento', 'glutei']),
('Abductor Machine (per Glutei)', 'glutes', 'machine', ARRAY['macchina', 'isolamento', 'glutei']),

-- ═══════════════════════════════════════════
-- ADDOMINALI (abs)
-- ═══════════════════════════════════════════
('Crunch a Terra', 'abs', 'bodyweight', ARRAY['corpo libero', 'isolamento', 'addominali']),
('Crunch ai Cavi', 'abs', 'cable_machine', ARRAY['cavi', 'isolamento', 'addominali']),
('Crunch alla Macchina', 'abs', 'machine', ARRAY['macchina', 'isolamento', 'addominali']),
('Crunch Inverso', 'abs', 'bodyweight', ARRAY['corpo libero', 'isolamento', 'addominali bassi']),
('Leg Raise alla Sbarra', 'abs', 'bodyweight', ARRAY['corpo libero', 'isolamento', 'addominali bassi']),
('Leg Raise su Panca', 'abs', 'bodyweight', ARRAY['corpo libero', 'isolamento', 'addominali bassi']),
('Sit Up', 'abs', 'bodyweight', ARRAY['corpo libero', 'compound', 'addominali']),
('Plank', 'abs', 'bodyweight', ARRAY['corpo libero', 'isometrico', 'addominali', 'core']),
('Plank Laterale', 'abs', 'bodyweight', ARRAY['corpo libero', 'isometrico', 'obliqui']),
('Russian Twist', 'abs', 'bodyweight', ARRAY['corpo libero', 'isolamento', 'obliqui']),
('Woodchop al Cavo', 'abs', 'cable_machine', ARRAY['cavi', 'isolamento', 'obliqui']),
('Ab Rollout (Ruota Addominali)', 'abs', 'bodyweight', ARRAY['corpo libero', 'compound', 'addominali', 'core']),
('Mountain Climber', 'abs', 'bodyweight', ARRAY['corpo libero', 'compound', 'addominali', 'cardio']),
('Vacuum Addominale', 'abs', 'bodyweight', ARRAY['corpo libero', 'isometrico', 'trasverso'])

ON CONFLICT DO NOTHING;
