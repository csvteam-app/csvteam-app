import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useMyAvailability() {
    const { user } = useAuth();
    const athleteId = user?.id;

    const [availability, setAvailability] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAvailability = useCallback(async () => {
        if (!athleteId) return;
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('athlete_availability')
                .select('*')
                .eq('athlete_id', athleteId)
                .order('day_of_week')
                .order('start_time');

            if (error) throw error;
            setAvailability(data || []);
        } catch (error) {
            console.error('Error fetching athlete availability:', error);
        } finally {
            setIsLoading(false);
        }
    }, [athleteId]);

    useEffect(() => {
        fetchAvailability();
    }, [fetchAvailability]);

    const saveAvailability = async (slots) => {
        if (!athleteId) return false;

        // 1. Delete all existing
        const { error: delErr } = await supabase
            .from('athlete_availability')
            .delete()
            .eq('athlete_id', athleteId);

        if (delErr) {
            console.error('Error deleting old availability:', delErr);
            return false;
        }

        if (slots.length === 0) {
            await fetchAvailability();
            return true;
        }

        // 2. Insert new
        const rows = slots.map(s => ({
            athlete_id: athleteId,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            prefers_pair: s.prefers_pair || false
        }));

        const { error: insErr } = await supabase
            .from('athlete_availability')
            .insert(rows);

        if (insErr) {
            console.error('Error saving availability:', insErr);
            return false;
        }

        await fetchAvailability();
        return true;
    };

    return {
        availability,
        isLoading,
        saveAvailability,
        refresh: fetchAvailability
    };
}
