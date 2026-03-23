/**
 * useAthleteData
 * Fetches the authenticated athlete's real program, workout days, exercises,
 * and nutrition targets from Supabase.
 *
 * Returns:
 *   isLoading   – true while first fetch is in progress
 *   error       – string | null
 *   program     – { id, name, days: [{ id, name, order, exercises: [...] }] }
 *   nutritionTargets – { kcal, protein_g, carbs_g, fat_g } | null
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useAthleteData() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [program, setProgram] = useState(null);
    const [nutritionTargets, setNutritionTargets] = useState(null);

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        async function fetchAll() {
            setIsLoading(true);
            setError(null);

            // ═══ RUN PROGRAM + NUTRITION IN PARALLEL ═══
            const [programResult, nutritionResult] = await Promise.allSettled([
                fetchProgram(user.id),
                fetchNutrition(user.id),
            ]);

            if (cancelled) return;

            // Process program result
            if (programResult.status === 'fulfilled') {
                setProgram(programResult.value);
            } else {
                console.warn('[AthleteData] Program fetch error:', programResult.reason);
                setProgram(null);
            }

            // Process nutrition result
            if (nutritionResult.status === 'fulfilled') {
                setNutritionTargets(nutritionResult.value);
            } else {
                console.warn('[AthleteData] Nutrition fetch error:', nutritionResult.reason);
            }

            if (!cancelled) setIsLoading(false);
        }

        fetchAll();
        return () => { cancelled = true; };
    }, [user?.id]);

    return { isLoading, error, program, nutritionTargets };
}

// ── Isolated fetch functions (no state, pure async) ──

async function fetchProgram(userId) {
    // Step 1: Get assignment
    const { data: assignment, error: aErr } = await supabase
        .from('athlete_programs')
        .select('program_id')
        .eq('athlete_id', userId)
        .order('assigned_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (aErr) throw new Error(aErr.message);
    if (!assignment) return null;

    // Step 2: Get program + days IN PARALLEL
    const [progRes, daysRes] = await Promise.all([
        supabase.from('programs').select('id, name').eq('id', assignment.program_id).single(),
        supabase.from('program_days').select('id, name, day_order').eq('program_id', assignment.program_id).order('day_order', { ascending: true }),
    ]);

    if (progRes.error) throw new Error(progRes.error.message);
    if (daysRes.error) throw new Error(daysRes.error.message);

    const prog = progRes.data;
    const days = daysRes.data || [];

    // Step 3: Fetch ALL exercises for ALL days IN PARALLEL (not one-by-one)
    const exercisePromises = days.map(day =>
        supabase
            .from('program_exercises')
            .select('id, exercise_id, sets, reps, rest_seconds, notes, order_index, exercises ( id, name, primary_muscle_group, video_url )')
            .eq('day_id', day.id)
            .order('order_index', { ascending: true })
    );

    const exerciseResults = await Promise.all(exercisePromises);

    const enrichedDays = days.map((day, idx) => {
        const exResult = exerciseResults[idx];
        const progExs = exResult.error ? [] : (exResult.data || []);
        return {
            id: day.id,
            name: day.name,
            order: day.day_order,
            exercises: progExs.map(pe => ({
                id: pe.id,
                exerciseId: pe.exercise_id,
                name: pe.exercises?.name ?? 'Esercizio sconosciuto',
                muscleGroup: pe.exercises?.primary_muscle_group ?? '',
                videoUrl: pe.exercises?.video_url ?? null,
                sets: pe.sets ?? 3,
                reps: pe.reps ?? '8-12',
                rest: pe.rest_seconds ?? 90,
                notes: pe.notes ?? '',
            })),
        };
    });

    return { id: prog.id, name: prog.name, days: enrichedDays };
}

async function fetchNutrition(userId) {
    const { data: nt, error: ntErr } = await supabase
        .from('nutrition_targets')
        .select('*')
        .eq('athlete_id', userId);

    if (ntErr) throw new Error(ntErr.message);

    const activeRow = nt && nt.length > 0
        ? nt.filter(r => r.is_active).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || nt[0]
        : null;

    if (!activeRow) return null;

    return {
        kcal: activeRow.calories,
        protein_g: activeRow.protein,
        carbs_g: activeRow.carbs,
        fat_g: activeRow.fats,
        p: activeRow.protein,
        c: activeRow.carbs,
        f: activeRow.fats,
    };
}
