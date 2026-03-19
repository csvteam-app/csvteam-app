/**
 * useAthleteData
 * Fetches the authenticated athlete's real program, workout days, exercises,
 * and nutrition targets from Supabase.
 *
 * Returns:
 *   isLoading   – true while first fetch is in progress
 *   error       – string | null
 *   program     – { id, name, days: [{ id, name, order, exercises: [{ id, exerciseId, name, sets, reps, rest, notes }] }] }
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
    const [ntDebug, setNtDebug] = useState('loading...');

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        let cancelled = false;

        async function fetchAll() {
            setIsLoading(true);
            setError(null);

            // ═══ PROGRAM FETCH (independent) ═══
            try {
                const { data: assignment, error: aErr } = await supabase
                    .from('athlete_programs')
                    .select('program_id')
                    .eq('athlete_id', user.id)
                    .order('assigned_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (aErr) throw new Error(aErr.message);

                if (!assignment) {
                    if (!cancelled) setProgram(null);
                } else {
                    const { data: prog, error: pErr } = await supabase
                        .from('programs')
                        .select('id, name')
                        .eq('id', assignment.program_id)
                        .single();

                    if (pErr) throw new Error(pErr.message);

                    const { data: days, error: dErr } = await supabase
                        .from('program_days')
                        .select('id, name, day_order')
                        .eq('program_id', prog.id)
                        .order('day_order', { ascending: true });

                    if (dErr) throw new Error(dErr.message);

                    const enrichedDays = await Promise.all(
                        (days || []).map(async (day) => {
                            const { data: progExs, error: exErr } = await supabase
                                .from('program_exercises')
                                .select(`
                                    id,
                                    exercise_id,
                                    sets,
                                    reps,
                                    rest_seconds,
                                    notes,
                                    order_index,
                                    exercises ( id, name, primary_muscle_group, video_url )
                                `)
                                .eq('day_id', day.id)
                                .order('order_index', { ascending: true });

                            if (exErr) throw new Error(exErr.message);

                            return {
                                id: day.id,
                                name: day.name,
                                order: day.day_order,
                                exercises: (progExs || []).map((pe) => ({
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
                        })
                    );

                    if (!cancelled) {
                        setProgram({ id: prog.id, name: prog.name, days: enrichedDays });
                    }
                }
            } catch (err) {
                console.warn('[AthleteData] Program fetch error (non-blocking):', err.message);
                if (!cancelled) setProgram(null);
            }

            // ═══ NUTRITION TARGETS FETCH (always runs, independent) ═══
            try {
                setNtDebug('fetching... userId=' + user.id);
                const { data: nt, error: ntErr } = await supabase
                    .from('nutrition_targets')
                    .select('*')
                    .eq('athlete_id', user.id);

                // Capture ALL debug info
                const debugMsg = `userId=${user.id} | rows=${nt?.length ?? 0} | error=${ntErr?.message || 'none'} | rawData=${JSON.stringify(nt)}`;
                console.log('[AthleteData] NT DEBUG:', debugMsg);

                if (!cancelled) {
                    setNtDebug(debugMsg);

                    // Pick the most recent active row
                    const activeRow = nt && nt.length > 0
                        ? nt.filter(r => r.is_active).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || nt[0]
                        : null;

                    setNutritionTargets(activeRow ? {
                        kcal: activeRow.calories,
                        protein_g: activeRow.protein,
                        carbs_g: activeRow.carbs,
                        fat_g: activeRow.fats,
                        p: activeRow.protein,
                        c: activeRow.carbs,
                        f: activeRow.fats
                    } : null);
                }
            } catch (err) {
                console.error('[AthleteData] Nutrition fetch error:', err.message);
                if (!cancelled) setNtDebug('CATCH ERROR: ' + err.message);
            }

            if (!cancelled) {
                setIsLoading(false);
            }
        }

        fetchAll();
        return () => { cancelled = true; };
    }, [user?.id]);

    return { isLoading, error, program, nutritionTargets, ntDebug };
}
