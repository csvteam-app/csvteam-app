-- ============================================================
-- FIX PART B: Views & Traffic Light Analytics
-- Paste into Supabase SQL Editor and click RUN
-- Run this AFTER Part A completes successfully
-- ============================================================

-- 1. PROGRAM WEEKLY FREQUENCY
DROP VIEW IF EXISTS api_coach_dashboard CASCADE;
DROP VIEW IF EXISTS api_client_status_summary CASCADE;
DROP VIEW IF EXISTS coach_client_overall_status CASCADE;
DROP VIEW IF EXISTS client_performance_metrics CASCADE;
DROP VIEW IF EXISTS client_training_adherence CASCADE;
DROP VIEW IF EXISTS program_weekly_frequency CASCADE;
DROP VIEW IF EXISTS coach_client_nutrition_summary CASCADE;
DROP VIEW IF EXISTS client_nutrition_daily_metrics CASCADE;

CREATE OR REPLACE VIEW program_weekly_frequency AS
SELECT
    p.id as program_id,
    p.name as program_name,
    COUNT(pd.id) as total_days,
    COUNT(pd.id) as expected_sessions_per_week
FROM programs p
LEFT JOIN program_days pd ON pd.program_id = p.id
GROUP BY p.id, p.name;

-- 2. TRAINING ADHERENCE VIEW
CREATE OR REPLACE VIEW client_training_adherence AS
SELECT
    ap.athlete_id,
    ap.program_id,
    pwf.expected_sessions_per_week,
    COUNT(wl.id) FILTER (WHERE wl.session_date >= CURRENT_DATE - 7) as sessions_last_7d,
    COUNT(wl.id) FILTER (WHERE wl.session_date >= CURRENT_DATE - 14) as sessions_last_14d,
    MAX(wl.session_date) as last_workout_date,
    CURRENT_DATE - MAX(wl.session_date) as days_since_last_workout,
    CASE
        WHEN pwf.expected_sessions_per_week > 0
        THEN ROUND((COUNT(wl.id) FILTER (WHERE wl.session_date >= CURRENT_DATE - 7)::numeric / pwf.expected_sessions_per_week) * 100, 1)
        ELSE NULL
    END as training_adherence_pct,
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

-- 3. PERFORMANCE METRICS VIEW
CREATE OR REPLACE VIEW client_performance_metrics AS
WITH ranked_exercise_sessions AS (
    SELECT
        el.athlete_id,
        el.exercise_id,
        wl.session_date,
        SUM(COALESCE(el.weight_kg, 0) * COALESCE(el.reps_completed, 0)) as volume_load,
        ROW_NUMBER() OVER (PARTITION BY el.athlete_id, el.exercise_id ORDER BY wl.session_date DESC) as session_rank
    FROM exercise_logs el
    JOIN workout_logs wl ON wl.id = el.workout_log_id
    GROUP BY el.athlete_id, el.exercise_id, wl.session_date
),
recent_trend AS (
    SELECT
        athlete_id, exercise_id,
        MAX(CASE WHEN session_rank = 1 THEN volume_load END) as latest_volume,
        MAX(CASE WHEN session_rank = 2 THEN volume_load END) as prev_volume,
        COUNT(*) as session_count
    FROM ranked_exercise_sessions WHERE session_rank <= 3
    GROUP BY athlete_id, exercise_id
),
exercise_classification AS (
    SELECT athlete_id, exercise_id, session_count,
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
    ROUND(
        CASE WHEN COUNT(*) > 0 THEN (
            (SUM(CASE WHEN trend = 'improving' THEN 1 ELSE 0 END)::numeric * 100 +
             SUM(CASE WHEN trend = 'stable' THEN 1 ELSE 0 END)::numeric * 70 +
             SUM(CASE WHEN trend = 'declining' THEN 1 ELSE 0 END)::numeric * 20) / COUNT(*)
        ) ELSE 0 END, 1
    ) as performance_score,
    CASE
        WHEN COUNT(*) = 0 OR SUM(CASE WHEN trend = 'no_data' THEN 1 ELSE 0 END) > COUNT(*) * 0.8 THEN 'gray'
        WHEN SUM(CASE WHEN trend = 'declining' THEN 1 ELSE 0 END) > COUNT(*) * 0.5 THEN 'red'
        WHEN SUM(CASE WHEN trend = 'declining' THEN 1 ELSE 0 END) > COUNT(*) * 0.25 THEN 'yellow'
        WHEN SUM(CASE WHEN trend = 'improving' THEN 1 ELSE 0 END) > 0 OR SUM(CASE WHEN trend = 'stable' THEN 1 ELSE 0 END) > 0 THEN 'green'
        ELSE 'gray'
    END as performance_traffic_light
FROM exercise_classification
GROUP BY athlete_id;

-- 4. DAILY METRICS
CREATE OR REPLACE VIEW client_nutrition_daily_metrics AS
SELECT
    dl.id as daily_log_id, dl.athlete_id, dl.log_date,
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

-- 5. COACH CLIENT NUTRITION SUMMARY
CREATE OR REPLACE VIEW coach_client_nutrition_summary AS
WITH last_7_days AS (
    SELECT
        athlete_id,
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
    caa.coach_id, caa.athlete_id,
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
    ROUND(
        ( ((COALESCE(l7.days_logged,0)::numeric/7.0) * 40) +
          (LEAST(COALESCE(l7.avg_cal_adherence,0), 100) * 0.30) +
          (LEAST(COALESCE(l7.avg_pro_adherence,0), 100) * 0.30)
        ), 1) as coach_score,
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

-- 6. MASTER COACH CLIENT OVERALL STATUS
CREATE OR REPLACE VIEW coach_client_overall_status AS
SELECT
    caa.coach_id, caa.athlete_id,
    p.full_name as athlete_name,
    p.email as athlete_email,
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
    cta.training_adherence_pct,
    cta.last_workout_date,
    cta.days_since_last_workout,
    cta.sessions_last_7d,
    COALESCE(cta.training_traffic_light, 'gray') as training_traffic_light,
    pm.performance_score,
    pm.improving_count, pm.stable_count, pm.declining_count,
    COALESCE(pm.performance_traffic_light, 'gray') as performance_traffic_light,
    (SELECT COUNT(*) FROM client_nutrition_alerts WHERE athlete_id = caa.athlete_id AND status = 'active') as active_alert_count,
    CASE
        WHEN (CASE WHEN cnm.risk_status IN ('urgent_attention') THEN true ELSE false END)
          OR COALESCE(cta.training_traffic_light, 'gray') = 'red'
          OR COALESCE(pm.performance_traffic_light, 'gray') = 'red' THEN 'red'
        WHEN (CASE WHEN cnm.risk_status IN ('minor_attention','moderate_attention') THEN true ELSE false END)
          OR COALESCE(cta.training_traffic_light, 'gray') = 'yellow'
          OR COALESCE(pm.performance_traffic_light, 'gray') = 'yellow' THEN 'yellow'
        WHEN COALESCE(cta.training_traffic_light, 'gray') = 'gray'
         AND COALESCE(pm.performance_traffic_light, 'gray') = 'gray'
         AND cnm.coach_score IS NULL THEN 'gray'
        ELSE 'green'
    END as overall_traffic_light,
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

-- 7. API COACH DASHBOARD (UI-READY)
CREATE OR REPLACE VIEW api_coach_dashboard AS
SELECT
    s.coach_id, s.athlete_id, s.athlete_name,
    s.nutrition_score, s.training_adherence_pct, s.performance_score,
    s.composite_score, s.last_nutrition_log, s.last_workout_date, s.active_alert_count,
    s.overall_traffic_light as overall_status_code,
    dic_o.sort_weight as overall_sort_weight,
    dic_o.label_coach as overall_label,
    dic_o.dot_color_token as overall_dot_token,
    dic_o.badge_bg_token as overall_bg_token,
    dic_o.badge_text_token as overall_text_token,
    s.nutrition_traffic_light as nutrition_status_code,
    dic_n.label_coach as nutrition_label,
    dic_n.dot_color_token as nutrition_dot_token,
    dic_n.action_coach as nutrition_action,
    s.training_traffic_light as training_status_code,
    dic_t.label_coach as training_label,
    dic_t.dot_color_token as training_dot_token,
    dic_t.action_coach as training_action,
    s.performance_traffic_light as performance_status_code,
    dic_p.label_coach as performance_label,
    dic_p.dot_color_token as performance_dot_token,
    dic_p.action_coach as performance_action
FROM coach_client_overall_status s
LEFT JOIN status_dictionary dic_o ON dic_o.status_code = s.overall_traffic_light
LEFT JOIN status_dictionary dic_n ON dic_n.status_code = s.nutrition_traffic_light
LEFT JOIN status_dictionary dic_t ON dic_t.status_code = s.training_traffic_light
LEFT JOIN status_dictionary dic_p ON dic_p.status_code = s.performance_traffic_light;

-- 8. API CLIENT STATUS SUMMARY
CREATE OR REPLACE VIEW api_client_status_summary AS
SELECT
    s.athlete_id,
    s.overall_traffic_light as status_code,
    dic_o.label_client as status_label,
    dic_o.badge_bg_token,
    dic_o.badge_text_token,
    s.nutrition_traffic_light as nutrition_status_code,
    dic_n.label_client as nutrition_label,
    dic_n.dot_color_token as nutrition_dot_token,
    s.training_traffic_light as training_status_code,
    dic_t.label_client as training_label,
    dic_t.dot_color_token as training_dot_token,
    s.performance_traffic_light as performance_status_code,
    dic_p.label_client as performance_label,
    dic_p.dot_color_token as performance_dot_token
FROM coach_client_overall_status s
LEFT JOIN status_dictionary dic_o ON dic_o.status_code = s.overall_traffic_light
LEFT JOIN status_dictionary dic_n ON dic_n.status_code = s.nutrition_traffic_light
LEFT JOIN status_dictionary dic_t ON dic_t.status_code = s.training_traffic_light
LEFT JOIN status_dictionary dic_p ON dic_p.status_code = s.performance_traffic_light;
