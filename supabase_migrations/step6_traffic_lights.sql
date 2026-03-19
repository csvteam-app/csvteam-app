-- ============================================================
-- CSV TEAM — PHASE 6: TRAFFIC LIGHT ANALYTICS SYSTEM
-- Training Adherence + Performance + Overall Client Status
-- Executable in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. WORKOUT LOGS (Session-level — one per completed workout)
-- This is the missing bridge between the program and performance.
-- ============================================================
CREATE TABLE IF NOT EXISTS workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    program_day_id UUID REFERENCES program_days(id) ON DELETE SET NULL,
    session_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_minutes INT,
    notes TEXT,
    completed BOOLEAN DEFAULT true,
    rpe INT CHECK (rpe BETWEEN 1 AND 10), -- Rate of Perceived Exertion
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_workout_logs_athlete_date ON workout_logs(athlete_id, session_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_program ON workout_logs(program_id, athlete_id);
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_coach_workout_logs" ON workout_logs;
CREATE POLICY "owner_coach_workout_logs" ON workout_logs FOR ALL USING (
    athlete_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
    OR EXISTS (SELECT 1 FROM coach_athlete_assignments WHERE coach_id = auth.uid() AND athlete_id = workout_logs.athlete_id AND status = 'active')
);

-- ============================================================
-- 2. EXERCISE LOGS (Set-level — multiple rows per workout_log)
-- This is the logbook: what did the client actually lift?
-- ============================================================
CREATE TABLE IF NOT EXISTS exercise_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
    athlete_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    set_number INT NOT NULL,
    reps_completed INT,
    weight_kg NUMERIC(6,2),
    weight_lbs NUMERIC(6,2),
    rir INT,    -- Reps In Reserve
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout ON exercise_logs(workout_log_id);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_athlete_exercise ON exercise_logs(athlete_id, exercise_id, created_at DESC);
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_coach_exercise_logs" ON exercise_logs;
CREATE POLICY "owner_coach_exercise_logs" ON exercise_logs FOR ALL USING (
    athlete_id = auth.uid()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('superadmin', 'coach'))
    OR EXISTS (SELECT 1 FROM coach_athlete_assignments WHERE coach_id = auth.uid() AND athlete_id = exercise_logs.athlete_id AND status = 'active')
);

-- ============================================================
-- 3. PROGRAM WEEKLY FREQUENCY HELPER
-- Calculates how many training days a program expects per week
-- ============================================================
CREATE OR REPLACE VIEW program_weekly_frequency AS
SELECT 
    p.id as program_id,
    p.name as program_name,
    COUNT(pd.id) as total_days,
    -- Assume a program is designed to be done on a weekly cycle
    -- (e.g., a 4-day program = 4 sessions per week)
    COUNT(pd.id) as expected_sessions_per_week
FROM programs p
LEFT JOIN program_days pd ON pd.program_id = p.id
GROUP BY p.id, p.name;

-- ============================================================
-- 4. TRAINING ADHERENCE VIEW (Last 7 days)
-- ============================================================
CREATE OR REPLACE VIEW client_training_adherence AS
SELECT 
    ap.athlete_id,
    ap.program_id,
    pwf.expected_sessions_per_week,
    COUNT(wl.id) FILTER (WHERE wl.session_date >= CURRENT_DATE - 7) as sessions_last_7d,
    COUNT(wl.id) FILTER (WHERE wl.session_date >= CURRENT_DATE - 14) as sessions_last_14d,
    MAX(wl.session_date) as last_workout_date,
    CURRENT_DATE - MAX(wl.session_date) as days_since_last_workout,
    
    -- Adherence percentage: sessions done / expected in same window
    CASE 
        WHEN pwf.expected_sessions_per_week > 0 
        THEN ROUND((COUNT(wl.id) FILTER (WHERE wl.session_date >= CURRENT_DATE - 7)::numeric / pwf.expected_sessions_per_week) * 100, 1)
        ELSE NULL 
    END as training_adherence_pct,

    -- Traffic Light
    CASE
        WHEN pwf.expected_sessions_per_week IS NULL OR MAX(wl.session_date) IS NULL THEN 'gray'
        WHEN (COUNT(wl.id) FILTER (WHERE wl.session_date >= CURRENT_DATE - 7)::numeric / pwf.expected_sessions_per_week) >= 0.85 THEN 'green'
        WHEN (COUNT(wl.id) FILTER (WHERE wl.session_date >= CURRENT_DATE - 7)::numeric / pwf.expected_sessions_per_week) >= 0.60 THEN 'yellow'
        ELSE 'red'
    END as training_traffic_light

FROM athlete_programs ap
LEFT JOIN program_weekly_frequency pwf ON pwf.program_id = ap.program_id
LEFT JOIN workout_logs wl ON wl.athlete_id = ap.athlete_id AND wl.program_id = ap.program_id AND wl.completed = true
WHERE ap.assigned_at = (
    SELECT MAX(ap2.assigned_at) FROM athlete_programs ap2 WHERE ap2.athlete_id = ap.athlete_id
)
GROUP BY ap.athlete_id, ap.program_id, pwf.expected_sessions_per_week;

-- ============================================================
-- 5. PERFORMANCE METRICS VIEW
-- Based on exercise-level set volume and load progression
-- Uses last 3 logged sessions per exercise to compute trend
-- ============================================================
CREATE OR REPLACE VIEW client_performance_metrics AS
WITH ranked_exercise_sessions AS (
    SELECT 
        el.athlete_id,
        el.exercise_id,
        wl.session_date,
        -- Volume load = sum of (weight × reps) per exercise per session
        SUM(COALESCE(el.weight_kg, 0) * COALESCE(el.reps_completed, 0)) as volume_load,
        ROW_NUMBER() OVER (PARTITION BY el.athlete_id, el.exercise_id ORDER BY wl.session_date DESC) as session_rank
    FROM exercise_logs el
    JOIN workout_logs wl ON wl.id = el.workout_log_id
    GROUP BY el.athlete_id, el.exercise_id, wl.session_date
),
recent_trend AS (
    SELECT 
        athlete_id,
        exercise_id,
        MAX(CASE WHEN session_rank = 1 THEN volume_load END) as latest_volume,
        MAX(CASE WHEN session_rank = 2 THEN volume_load END) as prev_volume,
        MAX(CASE WHEN session_rank = 3 THEN volume_load END) as prev2_volume,
        COUNT(*) as session_count
    FROM ranked_exercise_sessions
    WHERE session_rank <= 3
    GROUP BY athlete_id, exercise_id
),
exercise_classification AS (
    SELECT
        athlete_id,
        exercise_id,
        session_count,
        CASE
            WHEN session_count < 2 THEN 'no_data'
            WHEN latest_volume > COALESCE(prev_volume, 0) THEN 'improving'
            WHEN latest_volume = COALESCE(prev_volume, 0) THEN 'stable'
            ELSE 'declining'
        END as trend
    FROM recent_trend
)
SELECT
    athlete_id,
    COUNT(*) as exercises_evaluated,
    SUM(CASE WHEN trend = 'improving' THEN 1 ELSE 0 END) as improving_count,
    SUM(CASE WHEN trend = 'stable' THEN 1 ELSE 0 END) as stable_count,
    SUM(CASE WHEN trend = 'declining' THEN 1 ELSE 0 END) as declining_count,
    SUM(CASE WHEN trend = 'no_data' THEN 1 ELSE 0 END) as no_data_count,
    
    -- Performance Score (0–100): weights improving highest
    ROUND(
        CASE WHEN COUNT(*) > 0 
        THEN (
            (SUM(CASE WHEN trend = 'improving' THEN 1 ELSE 0 END)::numeric * 100 +
             SUM(CASE WHEN trend = 'stable' THEN 1 ELSE 0 END)::numeric * 70 +
             SUM(CASE WHEN trend = 'declining' THEN 1 ELSE 0 END)::numeric * 20)
            / COUNT(*)
        ) ELSE 0 END, 1
    ) as performance_score,
    
    -- Traffic Light
    CASE
        WHEN COUNT(*) = 0 OR SUM(CASE WHEN trend = 'no_data' THEN 1 ELSE 0 END) > COUNT(*) * 0.8 THEN 'gray'
        WHEN SUM(CASE WHEN trend = 'declining' THEN 1 ELSE 0 END) > COUNT(*) * 0.5 THEN 'red'
        WHEN SUM(CASE WHEN trend = 'declining' THEN 1 ELSE 0 END) > COUNT(*) * 0.25 THEN 'yellow'
        WHEN SUM(CASE WHEN trend = 'improving' THEN 1 ELSE 0 END) > 0 OR SUM(CASE WHEN trend = 'stable' THEN 1 ELSE 0 END) > 0 THEN 'green'
        ELSE 'gray'
    END as performance_traffic_light

FROM exercise_classification
GROUP BY athlete_id;

-- ============================================================
-- 6. MASTER COACH CLIENT STATUS VIEW
-- The single source of truth for the Coach Dashboard
-- Combines Nutrition + Training + Performance traffic lights
-- ============================================================
DROP VIEW IF EXISTS coach_client_overall_status;
CREATE OR REPLACE VIEW coach_client_overall_status AS
SELECT
    caa.coach_id,
    caa.athlete_id,
    p.full_name as athlete_name,
    p.email as athlete_email,
    
    -- === NUTRITION ===
    cnm.weekly_logging_completion_pct as nutrition_logging_pct,
    cnm.weekly_avg_calorie_adherence_pct as nutrition_calorie_pct,
    cnm.weekly_avg_protein_adherence_pct as nutrition_protein_pct,
    cnm.coach_score as nutrition_score,
    cnm.last_log_date as last_nutrition_log,
    CASE
        WHEN cnm.risk_status = 'on_track' THEN 'green'
        WHEN cnm.risk_status IN ('minor_attention') THEN 'yellow'
        WHEN cnm.risk_status IN ('moderate_attention', 'urgent_attention') THEN 'red'
        ELSE 'gray'
    END as nutrition_traffic_light,
    
    -- === TRAINING ===
    cta.training_adherence_pct,
    cta.last_workout_date,
    cta.days_since_last_workout,
    cta.sessions_last_7d,
    COALESCE(cta.training_traffic_light, 'gray') as training_traffic_light,
    
    -- === PERFORMANCE ===
    pm.performance_score,
    pm.improving_count, pm.stable_count, pm.declining_count,
    COALESCE(pm.performance_traffic_light, 'gray') as performance_traffic_light,
    
    -- === ALERTS ===
    (SELECT COUNT(*) FROM client_nutrition_alerts WHERE athlete_id = caa.athlete_id AND status = 'active') as active_alert_count,
    
    -- === OVERALL TRAFFIC LIGHT (Nutrition 40% + Training 35% + Performance 25%) ===
    CASE
        -- Any red in a major category forces overall red
        WHEN (CASE WHEN cnm.risk_status IN ('urgent_attention') THEN true ELSE false END)
          OR COALESCE(cta.training_traffic_light, 'gray') = 'red'
          OR COALESCE(pm.performance_traffic_light, 'gray') = 'red' THEN 'red'
        -- Multiple yellows = overall yellow
        WHEN (CASE WHEN cnm.risk_status IN ('minor_attention','moderate_attention') THEN true ELSE false END)
          OR COALESCE(cta.training_traffic_light, 'gray') = 'yellow'
          OR COALESCE(pm.performance_traffic_light, 'gray') = 'yellow' THEN 'yellow'
        -- All gray = gray
        WHEN COALESCE(cta.training_traffic_light, 'gray') = 'gray'
         AND COALESCE(pm.performance_traffic_light, 'gray') = 'gray'
         AND cnm.coach_score IS NULL THEN 'gray'
        ELSE 'green'
    END as overall_traffic_light,

    -- Composite score (for sorting)
    ROUND(
        (COALESCE(cnm.coach_score, 0) * 0.40) +
        (COALESCE(cta.training_adherence_pct, 0) * 0.35) +
        (COALESCE(pm.performance_score, 0) * 0.25)
    , 1) as composite_score,
    
    NOW() as updated_at

FROM coach_athlete_assignments caa
JOIN profiles p ON p.id = caa.athlete_id
LEFT JOIN coach_client_nutrition_summary cnm ON cnm.athlete_id = caa.athlete_id
LEFT JOIN client_training_adherence cta ON cta.athlete_id = caa.athlete_id
LEFT JOIN client_performance_metrics pm ON pm.athlete_id = caa.athlete_id
WHERE caa.status = 'active';
