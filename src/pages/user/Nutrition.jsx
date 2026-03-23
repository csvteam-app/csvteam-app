import React, { useState, useMemo, useEffect } from 'react';
import { useAthleteData } from '../../hooks/useAthleteData';
import { useNutrition } from '../../hooks/useNutrition';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { Plus, Trash2, ChevronRight, Apple, Info, Mic } from 'lucide-react';
import FoodSearch from '../../components/user/FoodSearch';
import VoiceLoggerModal from '../../components/user/VoiceLoggerModal';
import DateStrip from '../../components/user/DateStrip';
import FEATURE_FLAGS from '../../config/featureFlags';
import { perfTrackMount, perfTrackRender } from '../../components/debug/perfTracker';

const Nutrition = () => {
    perfTrackRender('Nutrition');
    useEffect(() => { perfTrackMount('Nutrition'); }, []);
    const { nutritionTargets } = useAthleteData();

    // ── Date state (default: today) ──
    // ── Date state (default: today, local timezone) ──
    const todayStr = useMemo(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);
    const [selectedDate, setSelectedDate] = useState(todayStr);

    const { logs, addFoodLog, removeFoodLog } = useNutrition(selectedDate);
    const [activeMeal, setActiveMeal] = useState(null);
    const [activeVoiceMeal, setActiveVoiceMeal] = useState(null);

    // Nutrition goals from Supabase (coach-set targets)
    const userGoals = useMemo(() => {
        if (nutritionTargets) {
            return {
                kcal: nutritionTargets.kcal ?? 2000,
                p: nutritionTargets.protein_g ?? 150,
                c: nutritionTargets.carbs_g ?? 200,
                f: nutritionTargets.fat_g ?? 60,
            };
        }
        return { kcal: 2000, p: 150, c: 200, f: 60 };
    }, [nutritionTargets]);

    // Safely get the log for the selected date
    const log = useMemo(() => {
        return {
            meals: logs || { colazione: [], pranzo: [], cena: [], snack: [] },
            goals: userGoals
        };
    }, [logs, userGoals]);

    const totals = useMemo(() => {
        let kcal = 0, p = 0, c = 0, f = 0;
        if (!log || !log.meals) return { kcal: 0, p: 0, c: 0, f: 0 };

        Object.values(log.meals).forEach(meal => {
            if (Array.isArray(meal)) {
                meal.forEach(item => {
                    if (item) {
                        const ratio = (item.grams || 0) / 100;
                        kcal += (item.kcal || 0) * ratio;
                        p += (item.p || 0) * ratio;
                        c += (item.c || 0) * ratio;
                        f += (item.f || 0) * ratio;
                    }
                });
            }
        });
        return { kcal: Math.round(kcal), p: Math.round(p), c: Math.round(c), f: Math.round(f) };
    }, [log]);

    const progressKcal = log?.goals?.kcal ? Math.min(100, (totals.kcal / log.goals.kcal) * 100) : 0;

    const mealMacros = (mealKey) => {
        let k = 0, p = 0, c = 0, f = 0;
        const mealArr = log?.meals?.[mealKey];
        if (Array.isArray(mealArr)) {
            mealArr.forEach(item => {
                if (item) {
                    const ratio = (item.grams || 0) / 100;
                    k += (item.kcal || 0) * ratio;
                    p += (item.p || 0) * ratio;
                    c += (item.c || 0) * ratio;
                    f += (item.f || 0) * ratio;
                }
            });
        }
        return { k: Math.round(k), p: Math.round(p), c: Math.round(c), f: Math.round(f) };
    };

    // Build friendly date label for header
    const getDateLabel = () => {
        if (selectedDate === todayStr) {
            return `Oggi, ${new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}`;
        }
        const d = new Date(selectedDate + 'T00:00:00');
        const yest = new Date();
        yest.setDate(yest.getDate() - 1);
        if (selectedDate === yest.toISOString().split('T')[0]) {
            return `Ieri, ${d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}`;
        }
        const tmrw = new Date();
        tmrw.setDate(tmrw.getDate() + 1);
        if (selectedDate === tmrw.toISOString().split('T')[0]) {
            return `Domani, ${d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}`;
        }
        return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    return (
        <div className="global-container animate-fade-in" style={{ paddingBottom: '144px' }}>
            <div className="w-full" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

                {/* ═══ DATE STRIP — FatSecret-style ═══ */}
                <DateStrip selectedDate={selectedDate} onDateChange={setSelectedDate} />

            <div className="flex-col gap-1" style={{ marginBottom: '16px' }}>
                <p className="text-label" style={{ color: 'rgba(255,255,255,0.5)' }}>{getDateLabel()}</p>
                <h1 className="text-h1">Diario</h1>
            </div>


            {/* Riepilogo Macro - Stile Cockpit (Minimalista) */}
            <div style={{ marginBottom: '32px' }}>
                <div className="flex-row justify-between items-end" style={{ marginBottom: '16px' }}>
                    <div>
                        <p className="text-h1" style={{ fontSize: 'clamp(2rem, 8vw, 3rem)', lineHeight: 1, letterSpacing: '-0.02em', fontWeight: 800 }}>{totals.kcal}</p>
                        <p className="text-label" style={{ marginTop: '4px' }}>Calorie / <span style={{ opacity: 0.4 }}>{(log?.goals?.kcal || 0)}</span></p>
                    </div>
                    <div style={{ textAlign: 'right', paddingBottom: '4px' }}>
                        <p className="text-h3" style={{ color: totals.kcal > (log?.goals?.kcal || 0) ? 'var(--accent-coral)' : 'var(--accent-gold)' }}>
                            {Math.max(0, (log?.goals?.kcal || 0) - totals.kcal)}
                        </p>
                        <p className="text-label" style={{ fontSize: '0.65rem', opacity: 0.6 }}>Rimanenti</p>
                    </div>
                </div>

                <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden', marginBottom: '24px' }}>
                    <div style={{ height: '100%', width: `${progressKcal}%`, background: 'var(--text-main)', transition: 'width 0.4s ease-out' }} />
                </div>

                <div className="flex-row gap-4" style={{ flexWrap: 'wrap' }}>
                    {[
                        { label: 'PRO', val: totals.p, goal: log?.goals?.p || 0, color: '#fff' },
                        { label: 'CAR', val: totals.c, goal: log?.goals?.c || 0, color: 'var(--accent-gold)' },
                        { label: 'FAT', val: totals.f, goal: log?.goals?.f || 0, color: 'rgba(255,255,255,0.5)' },
                    ].map(m => (
                        <div key={m.label} style={{ flex: 1 }} className="flex-col gap-1">
                            <div className="flex-row justify-between items-baseline">
                                <span className="text-label" style={{ fontSize: '0.65rem', color: m.color === '#fff' ? '#fff' : 'var(--text-muted)' }}>{m.label}</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{m.val}<span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>/{m.goal}</span></span>
                            </div>
                            <div style={{ height: '2px', background: 'rgba(255,255,255,0.04)', borderRadius: '1px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${m.goal ? Math.min(100, (m.val / m.goal) * 100) : 0}%`, background: m.color }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lista Pasti - Nessuna Card, Solo Liste */}
            <div className="flex-col gap-5">
                {['colazione', 'pranzo', 'cena', 'snack'].map(mKey => {
                    const mealItems = log?.meals?.[mKey] || [];
                    const macros = mealMacros(mKey);
                    return (
                        <div key={mKey} className="flex-col">
                            {/* Meal Header */}
                            <div
                                style={{ paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                                className="flex-row justify-between items-end"
                            >
                                <div>
                                    <h3 className="text-h3" style={{ textTransform: 'capitalize', fontWeight: 700, letterSpacing: '0.02em', marginBottom: '4px' }}>{mKey}</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                                        <span style={{ color: '#fff', fontWeight: 600 }}>{macros.k}</span> kcal • {macros.p}P {macros.c}C {macros.f}F
                                    </p>
                                </div>
                                <div className="flex-row gap-2">
                                    {FEATURE_FLAGS.VOICE_AI && (
                                        <Button size="sm" variant="outline" onClick={() => setActiveVoiceMeal(mKey)} style={{ borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)', padding: '6px' }}>
                                            <Mic size={16} />
                                        </Button>
                                    )}
                                    <Button size="sm" variant="ghost" onClick={() => setActiveMeal(mKey)} style={{ color: 'var(--accent-gold)', padding: '4px 8px', height: 'auto' }}>
                                        <Plus size={18} />
                                    </Button>
                                </div>
                            </div>

                            {/* Meal Items */}
                            <div className="flex-col">
                                {Array.isArray(mealItems) && mealItems.map((item, index) => (
                                    <div
                                        key={item.logged_id}
                                        className="flex-row justify-between items-center"
                                        style={{
                                            padding: '16px 0',
                                            borderBottom: index === mealItems.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.03)'
                                        }}
                                    >
                                        <div className="flex-col">
                                            <p style={{ fontWeight: 500, fontSize: '0.95rem', color: '#fff', marginBottom: '2px' }}>{item.name}</p>
                                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                                                {item.grams}g • <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{Math.round((item.kcal || 0) * (item.grams || 0) / 100)} kcal</span>
                                            </p>
                                        </div>
                                        <button onClick={() => removeFoodLog(mKey, item.logged_id)} style={{ padding: '8px', opacity: 0.4, transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.4}>
                                            <Trash2 size={16} color="var(--accent-coral)" />
                                        </button>
                                    </div>
                                ))}
                                {mealItems.length === 0 && (
                                    <div style={{ padding: '16px 0', display: 'flex', alignItems: 'center' }}>
                                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Nessun alimento inserito</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Minimalist Coach Advice */}
            <div style={{ marginTop: '24px', padding: '16px', borderLeft: '2px solid var(--accent-gold)', background: 'rgba(255,255,255,0.02)', borderRadius: '0 8px 8px 0' }}>
                <div className="flex-row gap-2 items-center">
                    <Info size={16} color="var(--accent-gold)" />
                    <p className="text-small" style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                        Mantieni le proteine stabili a <strong style={{ color: '#fff' }}>{log?.goals?.p || 0}g</strong>.
                    </p>
                </div>
            </div>

            {activeMeal && (
                <FoodSearch
                    meal={activeMeal}
                    onClose={() => setActiveMeal(null)}
                    onSelect={(food, g) => addFoodLog(activeMeal, food, g)}
                />
            )}

            {FEATURE_FLAGS.VOICE_AI && activeVoiceMeal && (
                <VoiceLoggerModal
                    meal={activeVoiceMeal}
                    onClose={() => setActiveVoiceMeal(null)}
                    onAddMultiple={(items) => {
                        items.forEach(({ food, grams }) => {
                            addFoodLog(activeVoiceMeal, food, grams);
                        });
                    }}
                />
            )}
            </div>
        </div>
    );
};

export default Nutrition;
