-- ============================================================
-- CSV TEAM — PHASE 5: COACHING ANALYTICS & SMART ALERTS
-- Executable in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. ALERT RULES & CONFIGURATION
-- ============================================================
CREATE TABLE IF NOT EXISTS nutrition_alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_code TEXT UNIQUE NOT NULL,
    rule_name TEXT NOT NULL,
    description TEXT,
    default_enabled BOOLEAN DEFAULT true,
    threshold_value NUMERIC(7,2),
    threshold_unit TEXT, -- e.g. '%', 'days'
    lookback_days INT DEFAULT 7,
    severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed basic alert rules
INSERT INTO nutrition_alert_rules (rule_code, rule_name, description, threshold_value, threshold_unit, lookback_days, severity) VALUES
('no_logs', 'Client Not Logging', 'Has not logged any food for consecutive days', 2, 'days', 7, 'high'),
('low_logging', 'Low Logging Completion', 'Weekly days logged is below acceptable percentage', 60, '%', 7, 'medium'),
('low_protein', 'Under Eating Protein', 'Average protein adherence is dangerously low', 80, '%', 7, 'high'),
('under_calories', 'Under Eating Calories', 'Average calorie adherence is dangerously low', 80, '%', 7, 'high'),
('over_calories', 'Over Eating Calories', 'Average calorie adherence is too high', 115, '%', 7, 'medium')
ON CONFLICT (rule_code) DO NOTHING;

-- ============================================================
-- 2. CLIENT ACTIVE ALERTS
-- ============================================================
CREATE TABLE IF NOT EXISTS client_nutrition_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    alert_rule_code TEXT NOT NULL REFERENCES nutrition_alert_rules(rule_code),
    severity TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed')),
    alert_date DATE DEFAULT CURRENT_DATE,
    context_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    UNIQUE(athlete_id, alert_rule_code, alert_date)
);
CREATE INDEX IF NOT EXISTS idx_client_nutrition_alerts_active ON client_nutrition_alerts(coach_id, status);

-- ============================================================
-- 3. DAILY METRICS ROLLING HISTORY (VIEW)
-- Computes precise adherence per day for quick scanning
-- ============================================================
DROP VIEW IF EXISTS client_nutrition_daily_metrics;
CREATE OR REPLACE VIEW client_nutrition_daily_metrics AS
SELECT 
    dl.id as daily_log_id,
    dl.athlete_id,
    dl.log_date,
    dl.total_calories, dl.total_protein, dl.total_carbs, dl.total_fat, dl.completion_status,
    COALESCE(dl.target_calories, nt.calories, 0) as target_calories,
    COALESCE(dl.target_protein, nt.protein, 0) as target_protein,
    COALESCE(dl.target_carbs, nt.carbs, 0) as target_carbs,
    COALESCE(dl.target_fat, nt.fats, 0) as target_fat,
    
    CASE WHEN COALESCE(dl.target_calories, nt.calories, 0) > 0 THEN ROUND((dl.total_calories / COALESCE(dl.target_calories, nt.calories)) * 100, 1) ELSE 0 END as calorie_adherence_pct,
    CASE WHEN COALESCE(dl.target_protein, nt.protein, 0) > 0 THEN ROUND((dl.total_protein / COALESCE(dl.target_protein, nt.protein)) * 100, 1) ELSE 0 END as protein_adherence_pct,
    CASE WHEN COALESCE(dl.target_carbs, nt.carbs, 0) > 0 THEN ROUND((dl.total_carbs / COALESCE(dl.target_carbs, nt.carbs)) * 100, 1) ELSE 0 END as carbs_adherence_pct,
    CASE WHEN COALESCE(dl.target_fat, nt.fats, 0) > 0 THEN ROUND((dl.total_fat / COALESCE(dl.target_fat, nt.fats)) * 100, 1) ELSE 0 END as fat_adherence_pct,
    
    CASE WHEN dl.total_calories > 300 THEN true ELSE false END as is_logged,
    (SELECT COUNT(*) FROM log_meals WHERE daily_log_id = dl.id) as meals_logged_count
FROM daily_logs dl
LEFT JOIN nutrition_targets nt ON nt.id = dl.active_nutrition_target_id
WHERE dl.log_date >= (CURRENT_DATE - INTERVAL '30 days');

-- ============================================================
-- 4. COACH DASHBOARD SUMMARY (WEEKLY AGGREGATE VIEW)
-- The primary source of truth for the Coach assigned client list UI
-- ============================================================
DROP VIEW IF EXISTS coach_client_nutrition_summary;
CREATE OR REPLACE VIEW coach_client_nutrition_summary AS
WITH last_7_days AS (
    SELECT 
        athlete_id,
        MIN(log_date) as start_date,
        COUNT(log_date) as days_in_system,
        SUM(CASE WHEN is_logged THEN 1 ELSE 0 END) as days_logged,
        AVG(CASE WHEN is_logged THEN calorie_adherence_pct ELSE 0 END) as avg_cal_adherence,
        AVG(CASE WHEN is_logged THEN protein_adherence_pct ELSE 0 END) as avg_pro_adherence,
        MAX(CASE WHEN is_logged THEN log_date ELSE '2000-01-01'::date END) as last_log_date
    FROM client_nutrition_daily_metrics
    WHERE log_date >= (CURRENT_DATE - INTERVAL '7 days')
    GROUP BY athlete_id
)
SELECT 
    caa.coach_id,
    caa.athlete_id,
    p.full_name as athlete_name,
    t.calories as current_target_calories,
    t.protein as current_target_protein,
    t.carbs as current_target_carbs,
    t.fats as current_target_fat,
    
    COALESCE(l7.days_logged, 0) as weekly_days_logged,
    ROUND((COALESCE(l7.days_logged, 0)::numeric / 7.0) * 100, 1) as weekly_logging_completion_pct,
    ROUND(COALESCE(l7.avg_cal_adherence, 0), 1) as weekly_avg_calorie_adherence_pct,
    ROUND(COALESCE(l7.avg_pro_adherence, 0), 1) as weekly_avg_protein_adherence_pct,
    
    COALESCE(l7.last_log_date, '2000-01-01'::date) as last_log_date,
    CURRENT_DATE - COALESCE(NULLIF(l7.last_log_date, '2000-01-01'::date), CURRENT_DATE - 99) as days_since_last_log,
    
    (SELECT COUNT(*) FROM client_nutrition_alerts WHERE athlete_id = caa.athlete_id AND status = 'active') as active_alert_count,
    
    -- Composite Coach Score (0-100) based on Logging (40%) + Calories (30%) + Protein (30%)
    ROUND(
        ( ((COALESCE(l7.days_logged,0)::numeric/7.0) * 40) + 
          (LEAST(COALESCE(l7.avg_cal_adherence,0), 100) * 0.30) + 
          (LEAST(COALESCE(l7.avg_pro_adherence,0), 100) * 0.30) 
        ), 1) as coach_score,
        
    -- Dynamic Risk Status
    CASE 
        WHEN CURRENT_DATE - COALESCE(NULLIF(l7.last_log_date, '2000-01-01'::date), CURRENT_DATE - 99) >= 3 THEN 'urgent_attention'
        WHEN (COALESCE(l7.days_logged,0)::numeric/7.0) < 0.5 THEN 'urgent_attention'
        WHEN COALESCE(l7.avg_pro_adherence, 0) < 75 THEN 'moderate_attention'
        WHEN COALESCE(l7.avg_cal_adherence, 0) < 80 OR COALESCE(l7.avg_cal_adherence, 0) > 120 THEN 'minor_attention'
        ELSE 'on_track'
    END as risk_status

FROM coach_athlete_assignments caa
JOIN profiles p ON p.id = caa.athlete_id
LEFT JOIN nutrition_targets t ON t.athlete_id = caa.athlete_id AND t.is_active = true
LEFT JOIN last_7_days l7 ON l7.athlete_id = caa.athlete_id
WHERE caa.status = 'active';

-- ============================================================
-- 5. AUTOMATIC SYSTEM ALERTS EVALUATOR (BACKEND RPC)
-- Called via cron or when a coach opens the dashboard
-- ============================================================
CREATE OR REPLACE FUNCTION evaluate_all_coach_clients_alerts(p_coach_id UUID)
RETURNS VOID AS $$
DECLARE
    v_client RECORD;
    v_stats RECORD;
    v_alert_exists BOOLEAN;
BEGIN
    FOR v_client IN SELECT athlete_id FROM coach_athlete_assignments WHERE coach_id = p_coach_id AND status = 'active' LOOP
        
        -- Get 7 day stats
        SELECT 
            weekly_logging_completion_pct, 
            days_since_last_log, 
            weekly_avg_protein_adherence_pct,
            weekly_avg_calorie_adherence_pct
        INTO v_stats
        FROM coach_client_nutrition_summary
        WHERE athlete_id = v_client.athlete_id;

        IF v_stats IS NULL THEN CONTINUE; END IF;

        -- ALERT: no_logs (missed >= 2 days)
        IF v_stats.days_since_last_log >= 2 THEN
            INSERT INTO client_nutrition_alerts (athlete_id, coach_id, alert_rule_code, severity, context_json)
            VALUES (v_client.athlete_id, p_coach_id, 'no_logs', 'high', jsonb_build_object('days_since_last_log', v_stats.days_since_last_log))
            ON CONFLICT (athlete_id, alert_rule_code, alert_date) DO NOTHING;
        ELSE
            UPDATE client_nutrition_alerts SET status = 'resolved', resolved_at = NOW() WHERE athlete_id = v_client.athlete_id AND alert_rule_code = 'no_logs' AND status = 'active';
        END IF;

        -- ALERT: low_logging (< 60%)
        IF v_stats.weekly_logging_completion_pct < 60 THEN
            INSERT INTO client_nutrition_alerts (athlete_id, coach_id, alert_rule_code, severity, context_json)
            VALUES (v_client.athlete_id, p_coach_id, 'low_logging', 'medium', jsonb_build_object('completion_pct', v_stats.weekly_logging_completion_pct))
            ON CONFLICT (athlete_id, alert_rule_code, alert_date) DO NOTHING;
        ELSE
             UPDATE client_nutrition_alerts SET status = 'resolved', resolved_at = NOW() WHERE athlete_id = v_client.athlete_id AND alert_rule_code = 'low_logging' AND status = 'active';
        END IF;

        -- ALERT: low_protein (< 80%) AND client has logged at least a bit (avoid double alerting with low_logging)
        IF v_stats.weekly_avg_protein_adherence_pct < 80 AND v_stats.weekly_logging_completion_pct > 25 THEN
            INSERT INTO client_nutrition_alerts (athlete_id, coach_id, alert_rule_code, severity, context_json)
            VALUES (v_client.athlete_id, p_coach_id, 'low_protein', 'high', jsonb_build_object('protein_pct', v_stats.weekly_avg_protein_adherence_pct))
            ON CONFLICT (athlete_id, alert_rule_code, alert_date) DO NOTHING;
        ELSE
             UPDATE client_nutrition_alerts SET status = 'resolved', resolved_at = NOW() WHERE athlete_id = v_client.athlete_id AND alert_rule_code = 'low_protein' AND status = 'active';
        END IF;

    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 6. RLS (ROW LEVEL SECURITY)
-- ============================================================
ALTER TABLE nutrition_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_nutrition_alerts ENABLE ROW LEVEL SECURITY;

-- Rules are read-only for coaches, editable by superadmin
CREATE POLICY "read_alert_rules" ON nutrition_alert_rules FOR SELECT USING (true);

-- Alerts can be viewed by assigned coach or superadmin
CREATE POLICY "coach_read_alerts" ON client_nutrition_alerts FOR SELECT USING (coach_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));
CREATE POLICY "coach_update_alerts" ON client_nutrition_alerts FOR UPDATE USING (coach_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'superadmin'));

