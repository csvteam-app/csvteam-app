-- ============================================================
-- CSV TEAM — PHASE 7: FRONTEND PRESENTATION LAYER
-- UI-Ready Traffic Light API mapping
-- Executable in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. STATUS DICTIONARY (Lookup table for UI Tokens)
-- Keeps the frontend perfectly aligned with the backend meaning
-- ============================================================
CREATE TABLE IF NOT EXISTS status_dictionary (
    status_code TEXT PRIMARY KEY,
    sort_weight INT NOT NULL,
    -- Coach UI
    label_coach TEXT NOT NULL,
    description_coach TEXT NOT NULL,
    action_coach TEXT,
    -- Client UI
    label_client TEXT NOT NULL,
    -- Design Tokens
    dot_color_token TEXT NOT NULL,
    badge_bg_token TEXT NOT NULL,
    badge_text_token TEXT NOT NULL
);

INSERT INTO status_dictionary (status_code, sort_weight, label_coach, description_coach, action_coach, label_client, dot_color_token, badge_bg_token, badge_text_token) VALUES
('red', 100, 'Critical', 'Significativo scostamento dai target previsti', 'Verifica log e contatta', 'Da riallineare', 'status-red', 'status-red-soft', 'status-red-text'),
('yellow', 200, 'Attention', 'Lieve scostamento dai target o trend in calo', 'Monitora prossimi giorni', 'Quasi in target', 'status-yellow', 'status-yellow-soft', 'status-yellow-text'),
('green', 300, 'On Track', 'Perfettamente in linea con il programma', 'Nessuna azione', 'In linea', 'status-green', 'status-green-soft', 'status-green-text'),
('gray', 400, 'No Data', 'Dati insufficienti per una valutazione', 'Richiedi compilazione log', 'Nessun dato', 'status-gray', 'status-gray-soft', 'status-gray-text')
ON CONFLICT (status_code) DO UPDATE SET 
    label_coach = EXCLUDED.label_coach, 
    label_client = EXCLUDED.label_client,
    action_coach = EXCLUDED.action_coach;

-- ============================================================
-- 2. FRONTEND-READY COACH DASHBOARD VIEW
-- Enriches the raw metrics from Phase 6 with luxury UI tokens
-- ============================================================
DROP VIEW IF EXISTS api_coach_dashboard;
CREATE OR REPLACE VIEW api_coach_dashboard AS
SELECT 
    s.coach_id,
    s.athlete_id,
    s.athlete_name,
    
    -- METRICS SUMMARY
    s.nutrition_score,
    s.training_adherence_pct,
    s.performance_score,
    s.composite_score,
    s.last_nutrition_log,
    s.last_workout_date,
    s.active_alert_count,
    
    -- ==========================================
    -- OVERALL STATUS (Highest Priority for Sorting)
    -- ==========================================
    s.overall_traffic_light as overall_status_code,
    dic_o.sort_weight as overall_sort_weight,
    dic_o.label_coach as overall_label,
    dic_o.dot_color_token as overall_dot_token,
    dic_o.badge_bg_token as overall_bg_token,
    dic_o.badge_text_token as overall_text_token,
    
    -- ==========================================
    -- NUTRITION STATUS
    -- ==========================================
    s.nutrition_traffic_light as nutrition_status_code,
    dic_n.label_coach as nutrition_label,
    dic_n.dot_color_token as nutrition_dot_token,
    dic_n.action_coach as nutrition_action,
    
    -- ==========================================
    -- TRAINING STATUS
    -- ==========================================
    s.training_traffic_light as training_status_code,
    dic_t.label_coach as training_label,
    dic_t.dot_color_token as training_dot_token,
    dic_t.action_coach as training_action,
    
    -- ==========================================
    -- PERFORMANCE STATUS
    -- ==========================================
    s.performance_traffic_light as performance_status_code,
    dic_p.label_coach as performance_label,
    dic_p.dot_color_token as performance_dot_token,
    dic_p.action_coach as performance_action

FROM coach_client_overall_status s
LEFT JOIN status_dictionary dic_o ON dic_o.status_code = s.overall_traffic_light
LEFT JOIN status_dictionary dic_n ON dic_n.status_code = s.nutrition_traffic_light
LEFT JOIN status_dictionary dic_t ON dic_t.status_code = s.training_traffic_light
LEFT JOIN status_dictionary dic_p ON dic_p.status_code = s.performance_traffic_light;

-- ============================================================
-- 3. FRONTEND-READY CLIENT HOME VIEW
-- Exposes the softer, motivational labels for the athlete app
-- ============================================================
DROP VIEW IF EXISTS api_client_status_summary;
CREATE OR REPLACE VIEW api_client_status_summary AS
SELECT 
    s.athlete_id,
    
    -- Overall Soft Status
    s.overall_traffic_light as status_code,
    dic_o.label_client as status_label,
    dic_o.badge_bg_token,
    dic_o.badge_text_token,
    
    -- Section: Nutrition
    s.nutrition_traffic_light as nutrition_status_code,
    dic_n.label_client as nutrition_label,
    dic_n.dot_color_token as nutrition_dot_token,
    
    -- Section: Training
    s.training_traffic_light as training_status_code,
    dic_t.label_client as training_label,
    dic_t.dot_color_token as training_dot_token,
    
    -- Section: Performance
    s.performance_traffic_light as performance_status_code,
    dic_p.label_client as performance_label,
    dic_p.dot_color_token as performance_dot_token

FROM coach_client_overall_status s
LEFT JOIN status_dictionary dic_o ON dic_o.status_code = s.overall_traffic_light
LEFT JOIN status_dictionary dic_n ON dic_n.status_code = s.nutrition_traffic_light
LEFT JOIN status_dictionary dic_t ON dic_t.status_code = s.training_traffic_light
LEFT JOIN status_dictionary dic_p ON dic_p.status_code = s.performance_traffic_light;

-- Enable RLS for dictionary (read-only for all authenticated users)
ALTER TABLE status_dictionary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_status_dict" ON status_dictionary;
CREATE POLICY "public_read_status_dict" ON status_dictionary FOR SELECT USING (true);
