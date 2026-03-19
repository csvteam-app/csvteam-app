-- =============================================================
-- GESTIONALE LEZIONI V3 — SQL Migration
-- CSV Team App · Supabase/PostgreSQL
-- =============================================================
-- Aggiunta preferenza tipo lezione (Tutte, Solo Singole, Solo Coppie)
-- alla disponibilità ricorrente del coach.
-- =============================================================

ALTER TABLE public.coach_availability 
ADD COLUMN IF NOT EXISTS lesson_type_preference text NOT NULL DEFAULT 'both' 
CHECK (lesson_type_preference IN ('single', 'pair', 'both'));

-- Nota: Abbiamo scelto di mantenere 'both' come default per retrocompatibilità.
