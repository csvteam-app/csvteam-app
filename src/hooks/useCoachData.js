import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useCoachData
 * Minimal hook to fetch data needed for the coach dashboard.
 * - Fetches all users with role 'athlete' from profiles
 * - Fetches all available programs from programs
 * - Fetches the current active program assignment for each athlete
 */
export function useCoachData() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [athletes, setAthletes] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [checkins, setCheckins] = useState([]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Fetch all athletes
            const { data: profilesData, error: profilesErr } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, subscription_status, subscription_plan, subscription_expires_at')
                .eq('role', 'athlete')
                .order('full_name');

            if (profilesErr) throw profilesErr;

            // 1b. Fetch Traffic Light Dashboard metrics
            const { data: dashboardData, error: dashboardErr } = await supabase
                .from('api_coach_dashboard')
                .select('*');

            if (dashboardErr) {
                console.warn('[CoachData] Could not fetch api_coach_dashboard, ensure SQL view exists:', dashboardErr);
            }

            // 2. Fetch all available programs
            const { data: programsData, error: programsErr } = await supabase
                .from('programs')
                .select('id, name')
                .order('name');

            if (programsErr) throw programsErr;

            // 3. Fetch latest program assignment for each athlete
            // (We fetch all and group by athlete id locally for simplicity)
            const { data: assignmentsData, error: assignmentsErr } = await supabase
                .from('athlete_programs')
                .select('athlete_id, program_id, assigned_at')
                .order('assigned_at', { ascending: false })
                .limit(1000);

            if (assignmentsErr) throw assignmentsErr;

            // 4. Fetch all workout checkins
            const { data: checkinData, error: checkinErr } = await supabase
                .from('workout_checkins')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (!checkinErr && checkinData) {
                setCheckins(checkinData);
            }

            // 5. Fetch all nutrition targets
            const { data: targetsData, error: targetsErr } = await supabase
                .from('nutrition_targets')
                .select('athlete_id, calories, protein, carbs, fats')
                .eq('is_active', true);

            if (targetsErr) {
                console.warn('[CoachData] Could not fetch nutrition_targets:', targetsErr.message);
            }

            // Map the latest program, dashboard data and nutrition targets to each athlete
            const mappedAthletes = profilesData.map(athlete => {
                const latestAssignment = assignmentsData.find(a => a.athlete_id === athlete.id);
                const assignedProgram = latestAssignment
                    ? programsData.find(p => p.id === latestAssignment.program_id)
                    : null;
                const trafficLights = dashboardData ? dashboardData.find(d => d.athlete_id === athlete.id) : null;
                const athleteTargets = targetsData ? targetsData.find(t => t.athlete_id === athlete.id) : null;

                return {
                    ...athlete,
                    assignedProgramId: latestAssignment?.program_id || null,
                    assignedProgramName: assignedProgram?.name || 'Nessun programma',
                    nutritionTargets: athleteTargets
                        ? {
                            kcal: athleteTargets.calories, p: athleteTargets.protein, c: athleteTargets.carbs, f: athleteTargets.fats,
                            protein_g: athleteTargets.protein, carbs_g: athleteTargets.carbs, fat_g: athleteTargets.fats
                        }
                        : null,
                    // Default values for UI placeholders if SQL view is empty
                    streak: 0,
                    alert: trafficLights?.active_alert_count > 0 || false,
                    score: trafficLights?.composite_score || 100,
                    trafficLights: trafficLights || null
                };
            });

            setAthletes(mappedAthletes);
            setPrograms(programsData);
        } catch (err) {
            console.error('[CoachData] Error:', err.message);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Helper to assign a program
    const assignProgram = async (athleteId, programId) => {
        try {
            const { error: assignErr } = await supabase
                .from('athlete_programs')
                .insert({
                    athlete_id: athleteId,
                    program_id: programId,
                    assigned_at: new Date().toISOString()
                });

            if (assignErr) throw assignErr;

            // Refresh data to reflect the new assignment
            await fetchData();
            return { success: true };
        } catch (err) {
            console.error('[CoachData] Assign Error:', err.message);
            return { error: err.message };
        }
    };

    // Helper to update nutrition targets (direct approach)
    const updateNutritionTargets = async (athleteId, targets) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non autenticato');

            // 1. Deactivate any existing active target for this athlete
            await supabase
                .from('nutrition_targets')
                .update({ is_active: false })
                .eq('athlete_id', athleteId)
                .eq('is_active', true);

            // 2. Insert new active target with coach_id and start_date
            const { error: insertErr } = await supabase
                .from('nutrition_targets')
                .insert({
                    athlete_id: athleteId,
                    coach_id: user.id,
                    calories: parseInt(targets.kcal) || 0,
                    protein: parseInt(targets.p) || 0,
                    carbs: parseInt(targets.c) || 0,
                    fats: parseInt(targets.f) || 0,
                    start_date: new Date().toISOString().split('T')[0],
                    is_active: true
                });

            if (insertErr) throw insertErr;

            // Optimistically update the local state
            setAthletes(prev => prev.map(a =>
                a.id === athleteId ? {
                    ...a, nutritionTargets: {
                        kcal: parseInt(targets.kcal) || 0,
                        p: parseInt(targets.p) || 0,
                        c: parseInt(targets.c) || 0,
                        f: parseInt(targets.f) || 0,
                        protein_g: parseInt(targets.p) || 0,
                        carbs_g: parseInt(targets.c) || 0,
                        fat_g: parseInt(targets.f) || 0
                    }
                } : a
            ));
            alert('✅ Obiettivi nutrizionali salvati!');
            return { success: true };
        } catch (err) {
            console.error('[CoachData] Nutrition Update Error:', err.message);
            alert('❌ Errore salvataggio: ' + err.message);
            return { error: err.message };
        }
    };

    return { isLoading, error, athletes, programs, checkins, assignProgram, updateNutritionTargets };
}
