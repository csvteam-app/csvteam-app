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

// Static data returned when gamification is disabled
const DISABLED_RETURN = {
    isLoading: false,
    gamification: { xp: 0, current_league: 'bronze', streak_days: 0, wallet_balance: 0 },
    dailyTasks: { steps: false, workout: false, photo: false, claimed: false, daily_gift: false },
    LEAGUES,
    completeDailyTask: async () => { },
    addXpAndPoints: async () => { },
};

const isGamificationEnabled = FEATURE_FLAGS.XP || FEATURE_FLAGS.GAMES || FEATURE_FLAGS.DAILY_TASKS;

export function useGamification() {
    // ALWAYS call hooks first (React Rules of Hooks)
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [dailyTasks, setDailyTasks] = useState({ steps: false, workout: false, photo: false, claimed: false, daily_gift: false });

    useEffect(() => {
        // Skip fetch if disabled or no user
        if (!isGamificationEnabled || !user) {
            setIsLoading(false);
            return;
        }

        const fetchGamification = async () => {
            setIsLoading(true);

            const [profileRes, tasksRes] = await Promise.allSettled([
                supabase.from('gamification_profiles').select('*').eq('id', user.id).single(),
                supabase.from('daily_tasks_log').select('task_type').eq('athlete_id', user.id).eq('completed_date', new Date().toISOString().split('T')[0]),
            ]);

            if (profileRes.status === 'fulfilled' && profileRes.value.data) {
                setProfile(profileRes.value.data);
            }

            if (tasksRes.status === 'fulfilled' && tasksRes.value.data) {
                const mapped = { steps: false, workout: false, photo: false, claimed: false, daily_gift: false };
                tasksRes.value.data.forEach(t => { mapped[t.task_type] = true; });
                setDailyTasks(mapped);
            }

            setIsLoading(false);
        };

        fetchGamification();
    }, [user?.id]);

    // Return disabled data if feature is off
    if (!isGamificationEnabled) {
        return DISABLED_RETURN;
    }

    const completeDailyTask = async (taskType) => {
        if (!user || dailyTasks[taskType]) return;

        const todayStr = new Date().toISOString().split('T')[0];

        await supabase
            .from('daily_tasks_log')
            .upsert({
                athlete_id: user.id,
                completed_date: todayStr,
                task_type: taskType
            }, { onConflict: 'athlete_id, task_type, completed_date' });

        const newTasks = { ...dailyTasks, [taskType]: true };
        setDailyTasks(newTasks);

        if (newTasks.steps && newTasks.workout && newTasks.photo && !newTasks.claimed) {
            await supabase.from('daily_tasks_log').upsert({
                athlete_id: user.id, completed_date: todayStr, task_type: 'claimed'
            }, { onConflict: 'athlete_id, task_type, completed_date' });
            newTasks.claimed = true;
            setDailyTasks(newTasks);

            if (profile) {
                const newXp = profile.xp + 20;
                const newLeague = [...LEAGUES].reverse().find(l => newXp >= l.threshold)?.id || 'bronze';

                await supabase.from('gamification_profiles').update({
                    xp: newXp,
                    updated_at: new Date().toISOString()
                }).eq('id', user.id);

                setProfile({ ...profile, xp: newXp, current_league: newLeague });
            }
        }
    };

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
