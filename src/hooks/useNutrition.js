import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * useNutrition — date-aware nutrition log hook.
 * @param {string} [dateStr] - ISO date string (YYYY-MM-DD). Defaults to today.
 */
export function useNutrition(dateStr) {
    const { user } = useAuth();
    const [logs, setLogs] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    // Local timezone date string (avoid UTC shift from toISOString)
    const getLocalDateStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const activeDate = dateStr || getLocalDateStr();

    useEffect(() => {
        if (!user) return;

        const fetchLogs = async () => {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('nutrition_logs')
                .select('*')
                .eq('athlete_id', user.id)
                .eq('date', activeDate);

            if (!error && data) {
                const mealsMap = { colazione: [], pranzo: [], cena: [], snack: [] };
                data.forEach(row => {
                    const mealKey = row.meal_type || 'snack';
                    if (mealsMap[mealKey]) {
                        mealsMap[mealKey].push({
                            logged_id: row.id,
                            food_id: row.food_id,
                            name: row.custom_food_name,
                            grams: parseFloat(row.amount_g),
                            kcal: parseFloat(row.kcal),
                            p: parseFloat(row.protein_g),
                            c: parseFloat(row.carbs_g),
                            f: parseFloat(row.fat_g),
                        });
                    }
                });
                setLogs(mealsMap);
            } else {
                setLogs({ colazione: [], pranzo: [], cena: [], snack: [] });
            }
            setIsLoading(false);
        };

        fetchLogs();
    }, [user?.id, activeDate]);

    const addFoodLog = useCallback(async (mealType, food, grams) => {
        if (!user) return;
        const ratio = grams / 100;

        const { data, error } = await supabase
            .from('nutrition_logs')
            .insert([{
                athlete_id: user.id,
                date: activeDate,
                food_id: food.id || null,
                custom_food_name: food.name,
                amount_g: grams,
                kcal: (food.kcal * ratio).toFixed(1),
                protein_g: (food.p * ratio).toFixed(1),
                carbs_g: (food.c * ratio).toFixed(1),
                fat_g: (food.f * ratio).toFixed(1),
                meal_type: mealType
            }])
            .select()
            .single();

        if (!error && data) {
            setLogs(prev => {
                const updated = { ...prev };
                if (!updated[mealType]) updated[mealType] = [];
                updated[mealType] = [...updated[mealType], {
                    logged_id: data.id,
                    food_id: data.food_id,
                    name: data.custom_food_name,
                    grams: parseFloat(data.amount_g),
                    kcal: parseFloat(data.kcal) / ratio,
                    p: parseFloat(data.protein_g) / ratio,
                    c: parseFloat(data.carbs_g) / ratio,
                    f: parseFloat(data.fat_g) / ratio,
                }];
                return updated;
            });
        }
    }, [user, activeDate]);

    const removeFoodLog = useCallback(async (mealType, loggedId) => {
        if (!user) return;

        const { error } = await supabase
            .from('nutrition_logs')
            .delete()
            .eq('id', loggedId)
            .eq('athlete_id', user.id);

        if (!error) {
            setLogs(prev => {
                const updated = { ...prev };
                if (updated[mealType]) {
                    updated[mealType] = updated[mealType].filter(item => item.logged_id !== loggedId);
                }
                return updated;
            });
        }
    }, [user]);

    return { logs, isLoading, addFoodLog, removeFoodLog };
}
