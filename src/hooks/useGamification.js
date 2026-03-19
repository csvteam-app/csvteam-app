import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import FEATURE_FLAGS from '../config/featureFlags';

export const LEAGUES = [
    { id: 'bronze', name: 'Bronzo', threshold: 0, icon: '🥉' },
    { id: 'silver', name: 'Argento', threshold: 1500, icon: '🥈' },
    { id: 'gold', name: 'Oro', threshold: 5000, icon: '🥇' },
    { id: 'diamond', name: 'Diamante', threshold: 12000, icon: '💎' },
    { id: 'olympia', name: 'Olympia', threshold: 25000, icon: '👑' }
];

// Dati statici restituiti quando la gamification è disattivata (Launch Light)
const DISABLED_RETURN = {
    isLoading: false,
    gamification: { xp: 0, current_league: 'bronze', streak_days: 0, wallet_balance: 0 },
    dailyTasks: { steps: false, workout: false, photo: false, claimed: false, daily_gift: false },
    LEAGUES,
    completeDailyTask: async () => { },
    addXpAndPoints: async () => { },
};

export function useGamification() {
    // ── Launch Light: skip tutte le fetch e la logica ──
    if (!FEATURE_FLAGS.XP && !FEATURE_FLAGS.GAMES && !FEATURE_FLAGS.DAILY_TASKS) {
        return DISABLED_RETURN;
    }

    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [dailyTasks, setDailyTasks] = useState({ steps: false, workout: false, photo: false, claimed: false, daily_gift: false });

    useEffect(() => {
        if (!user) return;

        const fetchGamification = async () => {
            setIsLoading(true);

            // 1. Fetch Profile
            const { data: gProfile } = await supabase
                .from('gamification_profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (gProfile) {
                setProfile(gProfile);
            }

            // 2. Fetch Daily Tasks for today
            const todayStr = new Date().toISOString().split('T')[0];
            const { data: tasks } = await supabase
                .from('daily_tasks_log')
                .select('task_type')
                .eq('athlete_id', user.id)
                .eq('completed_date', todayStr);

            if (tasks) {
                const mapped = { steps: false, workout: false, photo: false, claimed: false, daily_gift: false };
                tasks.forEach(t => { mapped[t.task_type] = true; });
                setDailyTasks(mapped);
            }

            setIsLoading(false);
        };

        fetchGamification();
    }, [user]);

    // Handle marking a task as complete and awarding XP
    const completeDailyTask = async (taskType) => {
        if (!user || dailyTasks[taskType]) return; // Already completed

        const todayStr = new Date().toISOString().split('T')[0];

        // Upsert the task log
        await supabase
            .from('daily_tasks_log')
            .upsert({
                athlete_id: user.id,
                completed_date: todayStr,
                task_type: taskType
            }, { onConflict: 'athlete_id, task_type, completed_date' });

        // Optimistically update UI
        const newTasks = { ...dailyTasks, [taskType]: true };
        setDailyTasks(newTasks);

        // Check if all 3 core tasks are done to award 'claimed' state
        if (newTasks.steps && newTasks.workout && newTasks.photo && !newTasks.claimed) {
            await supabase.from('daily_tasks_log').upsert({
                athlete_id: user.id, completed_date: todayStr, task_type: 'claimed'
            }, { onConflict: 'athlete_id, task_type, completed_date' });
            newTasks.claimed = true;
            setDailyTasks(newTasks);

            // Award Bonus XP
            if (profile) {
                const newXp = profile.xp + 20; // 20 XP bonus

                // Determine new league based on new XP
                const newLeague = [...LEAGUES].reverse().find(l => newXp >= l.threshold)?.id || 'bronze';

                await supabase.from('gamification_profiles').update({
                    xp: newXp,
                    updated_at: new Date().toISOString()
                }).eq('id', user.id);

                setProfile({ ...profile, xp: newXp, current_league: newLeague });
            }
        }
    };

    // Handle Shop Purchases
    const addXpAndPoints = async (xpToAdd, pointsToAdd) => {
        if (!profile || !user) return;
        const newXp = profile.xp + xpToAdd;
        const newBalance = profile.wallet_balance + pointsToAdd;

        const newLeague = [...LEAGUES].reverse().find(l => newXp >= l.threshold)?.id || 'bronze';

        await supabase.from('gamification_profiles').update({
            xp: newXp,
            wallet_balance: newBalance,
            updated_at: new Date().toISOString()
        }).eq('id', user.id);

        setProfile({ ...profile, xp: newXp, current_league: newLeague, wallet_balance: newBalance });
        return true;
    };

    return {
        isLoading,
        gamification: profile || { xp: 0, current_league: 'bronze', streak_days: 0, wallet_balance: 0 },
        dailyTasks,
        LEAGUES,
        completeDailyTask,
        addXpAndPoints
    };
}
