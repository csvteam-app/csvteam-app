import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useCoachData — Unified hook for the coach dashboard.
 * Merges athlete data, nutrition, traffic lights, subscriptions & approval.
 */
export function useCoachData() {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [athletes, setAthletes] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Fetch ALL profiles (athletes + pending users)
            const { data: profilesData, error: profilesErr } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, email, role, approval_status, subscription_status, subscription_plan, subscription_expires_at, created_at')
                .in('role', ['athlete'])
                .order('full_name');

            if (profilesErr) throw profilesErr;

            // 2. Traffic Light Dashboard metrics
            const { data: dashboardData } = await supabase
                .from('api_coach_dashboard')
                .select('*');

            // 3. Programs
            const { data: programsData, error: programsErr } = await supabase
                .from('programs')
                .select('id, name')
                .order('name');

            if (programsErr) throw programsErr;

            // 4. Latest program assignments
            const { data: assignmentsData } = await supabase
                .from('athlete_programs')
                .select('athlete_id, program_id, assigned_at')
                .order('assigned_at', { ascending: false })
                .limit(1000);

            // 5. Nutrition targets
            const { data: targetsData } = await supabase
                .from('nutrition_targets')
                .select('athlete_id, calories, protein, carbs, fats')
                .eq('is_active', true);

            // 6. Subscriptions
            const { data: subsData } = await supabase
                .from('subscriptions')
                .select('*')
                .order('created_at', { ascending: false });

            setSubscriptions(subsData || []);

            // Map everything to each athlete
            const mappedAthletes = (profilesData || []).map(athlete => {
                const latestAssignment = (assignmentsData || []).find(a => a.athlete_id === athlete.id);
                const assignedProgram = latestAssignment
                    ? (programsData || []).find(p => p.id === latestAssignment.program_id)
                    : null;
                const trafficLights = dashboardData ? dashboardData.find(d => d.athlete_id === athlete.id) : null;
                const athleteTargets = targetsData ? targetsData.find(t => t.athlete_id === athlete.id) : null;
                const userSubs = (subsData || []).filter(s => s.user_id === athlete.id);
                const activeSub = userSubs.find(s => s.status === 'active');

                return {
                    ...athlete,
                    assignedProgramId: latestAssignment?.program_id || null,
                    assignedProgramName: assignedProgram?.name || null,
                    nutritionTargets: athleteTargets
                        ? { kcal: athleteTargets.calories, p: athleteTargets.protein, c: athleteTargets.carbs, f: athleteTargets.fats }
                        : null,
                    streak: 0,
                    alert: trafficLights?.active_alert_count > 0 || false,
                    score: trafficLights?.composite_score || 100,
                    trafficLights: trafficLights || null,
                    subscriptionsList: userSubs,
                    activeSubscription: activeSub || null,
                };
            });

            setAthletes(mappedAthletes);
            setPrograms(programsData || []);
        } catch (err) {
            console.error('[CoachData] Error:', err.message);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ── Nutrition targets ──
    const updateNutritionTargets = async (athleteId, targets) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Non autenticato');

            await supabase
                .from('nutrition_targets')
                .update({ is_active: false })
                .eq('athlete_id', athleteId)
                .eq('is_active', true);

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

            setAthletes(prev => prev.map(a =>
                a.id === athleteId ? {
                    ...a, nutritionTargets: {
                        kcal: parseInt(targets.kcal) || 0,
                        p: parseInt(targets.p) || 0,
                        c: parseInt(targets.c) || 0,
                        f: parseInt(targets.f) || 0,
                    }
                } : a
            ));
            return { success: true };
        } catch (err) {
            console.error('[CoachData] Nutrition Update Error:', err.message);
            alert('❌ Errore salvataggio: ' + err.message);
            return { error: err.message };
        }
    };

    // ── Approve / Reject User ──
    const approveUser = async (userId) => {
        const { error: err } = await supabase
            .from('profiles')
            .update({ approval_status: 'approved', updated_at: new Date().toISOString() })
            .eq('id', userId);
        if (err) throw err;
        await fetchData();
    };

    const rejectUser = async (userId) => {
        const { error: err } = await supabase
            .from('profiles')
            .update({ approval_status: 'rejected', updated_at: new Date().toISOString() })
            .eq('id', userId);
        if (err) throw err;
        await fetchData();
    };

    // ── Assign Subscription ──
    const assignSubscription = async (userId, { packageType, durationMonths, startDate, notes }) => {
        const start = startDate || new Date().toISOString().split('T')[0];
        const endDate = new Date(start);
        endDate.setMonth(endDate.getMonth() + durationMonths);
        const end = endDate.toISOString().split('T')[0];

        const { data: session } = await supabase.auth.getSession();
        const adminId = session?.session?.user?.id;

        const { error: err } = await supabase
            .from('subscriptions')
            .insert({
                user_id: userId,
                package_type: packageType,
                duration_months: durationMonths,
                start_date: start,
                end_date: end,
                status: 'active',
                source: 'manual_admin',
                assigned_by: adminId,
                notes: notes || null,
            });

        if (err) throw err;

        await supabase.from('subscription_events').insert({
            user_id: userId,
            event_type: 'created',
            new_status: 'active',
            performed_by: adminId,
            metadata: { package_type: packageType, duration_months: durationMonths },
        });

        await fetchData();
    };

    // ── Revoke Subscription ──
    const revokeSubscription = async (subId) => {
        const { error: err } = await supabase
            .from('subscriptions')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('id', subId);
        if (err) throw err;
        await fetchData();
    };

    // ── Assign Program ──
    const assignProgram = async (athleteId, programId) => {
        const { error: err } = await supabase
            .from('athlete_programs')
            .insert({ athlete_id: athleteId, program_id: programId, assigned_at: new Date().toISOString() });
        if (err) throw err;
        await fetchData();
    };

    // ── Derived ──
    const pendingUsers = athletes.filter(u => u.approval_status === 'pending');

    return {
        isLoading, error, athletes, programs, subscriptions, pendingUsers,
        updateNutritionTargets, approveUser, rejectUser,
        assignSubscription, revokeSubscription, assignProgram,
        refresh: fetchData,
    };
}
