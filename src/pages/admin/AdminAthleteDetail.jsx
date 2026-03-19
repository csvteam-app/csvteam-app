import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ArrowLeft, Dumbbell, Utensils, ChevronDown, ChevronUp, Calendar, Weight, Repeat, Clock } from 'lucide-react';

const WARM_WHITE = '#FFF5E6';
const TABS = ['logbook', 'diario'];

// ── Formatters ──────────────────────────────────────────────
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '—';

// ── Meal type labels ─────────────────────────────────────────
const MEAL_LABELS = { breakfast: 'Colazione', lunch: 'Pranzo', snack: 'Spuntino', dinner: 'Cena' };

const AdminAthleteDetail = () => {
    const { athleteId } = useParams();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('logbook');
    const [athlete, setAthlete] = useState(null);

    // Logbook state
    const [sessions, setSessions] = useState([]);
    const [expandedSession, setExpandedSession] = useState(null);
    const [sessionSets, setSessionSets] = useState({});
    const [logbookLoading, setLogbookLoading] = useState(true);

    // Diet diary state
    const [dailyLogs, setDailyLogs] = useState([]);
    const [expandedDay, setExpandedDay] = useState(null);
    const [dayMeals, setDayMeals] = useState({});
    const [dietLoading, setDietLoading] = useState(true);

    // ── Load athlete profile ──────────────────────────────────
    useEffect(() => {
        if (!athleteId) return;
        supabase.from('profiles').select('id, full_name, avatar_url, email').eq('id', athleteId).maybeSingle()
            .then(({ data }) => setAthlete(data));
    }, [athleteId]);

    // ── Load workout sessions ──────────────────────────────────
    useEffect(() => {
        if (!athleteId) return;
        setLogbookLoading(true);
        (async () => {
            const { data } = await supabase
                .from('workout_sessions')
                .select('id, started_at, completed_at, program_day_id, program_days(name)')
                .eq('athlete_id', athleteId)
                .not('completed_at', 'is', null)
                .order('completed_at', { ascending: false })
                .limit(30);
            setSessions(data || []);
            setLogbookLoading(false);
        })();
    }, [athleteId]);

    // ── Load sets for a session (on expand) ──────────────────
    const loadSessionSets = async (sessionId) => {
        if (sessionSets[sessionId]) return; // already loaded
        const { data } = await supabase
            .from('logbook_sets')
            .select('set_number, weight, reps, rpe, exercises(name)')
            .eq('session_id', sessionId)
            .order('created_at');
        setSessionSets(prev => ({ ...prev, [sessionId]: data || [] }));
    };

    const toggleSession = (sessionId) => {
        if (expandedSession === sessionId) {
            setExpandedSession(null);
        } else {
            setExpandedSession(sessionId);
            loadSessionSets(sessionId);
        }
    };

    // ── Load daily logs ───────────────────────────────────────
    useEffect(() => {
        if (!athleteId || activeTab !== 'diario') return;
        setDietLoading(true);
        (async () => {
            const { data } = await supabase
                .from('daily_logs')
                .select('id, log_date, total_calories, total_protein, total_carbs, total_fat, completion_status')
                .eq('athlete_id', athleteId)
                .order('log_date', { ascending: false })
                .limit(30);
            setDailyLogs(data || []);
            setDietLoading(false);
        })();
    }, [athleteId, activeTab]);

    // ── Load meals for a day (on expand) ─────────────────────
    const loadDayMeals = async (dailyLogId) => {
        if (dayMeals[dailyLogId]) return;
        const { data } = await supabase
            .from('log_meals')
            .select('id, meal_type, custom_name, log_meal_items(id, custom_food_name, grams, calories, protein, carbs, fat, food_id, food_items(name))')
            .eq('daily_log_id', dailyLogId)
            .order('sort_order');
        setDayMeals(prev => ({ ...prev, [dailyLogId]: data || [] }));
    };

    const toggleDay = (dailyLogId) => {
        if (expandedDay === dailyLogId) {
            setExpandedDay(null);
        } else {
            setExpandedDay(dailyLogId);
            loadDayMeals(dailyLogId);
        }
    };

    // ── Derived: group logbook sets by exercise name ──────────
    const groupSetsByExercise = (sets) => {
        if (!sets) return [];
        const groups = {};
        sets.forEach(s => {
            const name = s.exercises?.name || 'Esercizio';
            if (!groups[name]) groups[name] = [];
            groups[name].push(s);
        });
        return Object.entries(groups);
    };

    const completionColor = (status) => {
        if (status === 'complete') return '#22c55e';
        if (status === 'partial') return '#eab308';
        return 'rgba(255,255,255,0.25)';
    };

    return (
        <div style={{
            minHeight: '100vh', backgroundColor: '#070709',
            backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(255,120,0,0.05) 0%, transparent 55%)',
            paddingBottom: '80px', paddingLeft: '16px', paddingRight: '16px',
            paddingTop: '16px', maxWidth: '860px', margin: '0 auto'
        }}>
            {/* ── HEADER ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <button onClick={() => navigate('/admin/dashboard')} style={{
                    width: '40px', height: '40px', borderRadius: '12px', border: 'none', cursor: 'pointer', flexShrink: 0,
                    background: 'linear-gradient(145deg, rgba(35,30,28,1), rgba(20,16,14,1))',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.06), 0 4px 8px rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)'
                }}>
                    <ArrowLeft size={20} />
                </button>

                {/* Avatar + Name */}
                {athlete?.avatar_url ? (
                    <img src={athlete.avatar_url} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,215,170,0.2)', flexShrink: 0 }} />
                ) : (
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(255,215,170,0.1)', border: '1px solid rgba(255,215,170,0.2)', flexShrink: 0 }} />
                )}
                <div>
                    <p style={{ fontSize: '0.68rem', fontFamily: 'Outfit', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,215,170,0.6)', marginBottom: '2px' }}>Scheda Atleta</p>
                    <h1 style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.3rem', color: '#fff', letterSpacing: '-0.01em' }}>{athlete?.full_name || 'Caricamento…'}</h1>
                </div>
            </div>

            {/* ── TABS ── */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(255,255,255,0.04)', borderRadius: '14px', padding: '4px' }}>
                {[
                    { key: 'logbook', label: 'Logbook Allenamenti', icon: <Dumbbell size={14} /> },
                    { key: 'diario', label: 'Diario Alimentare', icon: <Utensils size={14} /> },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        padding: '10px 8px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: activeTab === tab.key
                            ? 'linear-gradient(135deg, rgba(255,215,170,0.15) 0%, rgba(255,195,140,0.06) 100%)'
                            : 'transparent',
                        borderTop: activeTab === tab.key ? '1px solid rgba(255,215,170,0.3)' : '1px solid transparent',
                        color: activeTab === tab.key ? WARM_WHITE : 'rgba(255,255,255,0.35)',
                        fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.04em',
                        boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.4)' : 'none',
                    }}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* TAB: LOGBOOK ALLENAMENTI                                    */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'logbook' && (
                <div>
                    {logbookLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit' }}>Caricamento sessioni…</div>
                    ) : sessions.length === 0 ? (
                        <div style={{
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '20px', padding: '40px', textAlign: 'center'
                        }}>
                            <Dumbbell size={36} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 12px' }} />
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit' }}>Nessuna sessione completata.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {sessions.map(session => {
                                const isOpen = expandedSession === session.id;
                                const sets = sessionSets[session.id];
                                const grouped = groupSetsByExercise(sets);
                                const duration = session.completed_at && session.started_at
                                    ? Math.round((new Date(session.completed_at) - new Date(session.started_at)) / 60000) : null;

                                return (
                                    <div key={session.id} style={{
                                        background: 'linear-gradient(135deg, rgba(22,20,18,0.85) 0%, rgba(12,10,10,0.95) 100%)',
                                        borderTop: `1px solid ${isOpen ? 'rgba(255,215,170,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                        borderLeft: '1px solid rgba(255,215,170,0.04)',
                                        borderRight: '1px solid rgba(0,0,0,0.5)',
                                        borderBottom: '2px solid rgba(0,0,0,0.7)',
                                        borderRadius: '18px', overflow: 'hidden',
                                        boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                                        transition: 'border-color 0.2s ease'
                                    }}>
                                        {/* Session Row Header */}
                                        <div
                                            onClick={() => toggleSession(session.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '16px 18px', cursor: 'pointer',
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                                                    background: 'linear-gradient(145deg, rgba(40,36,32,1), rgba(22,18,16,1))',
                                                    border: '1px solid rgba(255,215,170,0.15)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    <Dumbbell size={16} color={WARM_WHITE} />
                                                </div>
                                                <div>
                                                    <p style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '2px' }}>
                                                        {session.program_days?.name || 'Sessione'}
                                                    </p>
                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Calendar size={11} />{fmtDate(session.completed_at)}
                                                        </span>
                                                        {duration && (
                                                            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                <Clock size={11} />{duration} min
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ color: 'rgba(255,255,255,0.3)' }}>
                                                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </div>
                                        </div>

                                        {/* Expanded Sets */}
                                        {isOpen && (
                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '0 18px 18px' }}>
                                                {!sets ? (
                                                    <p style={{ color: 'rgba(255,255,255,0.3)', padding: '16px 0', textAlign: 'center', fontSize: '0.85rem' }}>Caricamento…</p>
                                                ) : grouped.length === 0 ? (
                                                    <p style={{ color: 'rgba(255,255,255,0.25)', padding: '16px 0', textAlign: 'center', fontSize: '0.85rem' }}>Nessuna serie registrata.</p>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '14px' }}>
                                                        {grouped.map(([exerciseName, exSets]) => (
                                                            <div key={exerciseName}>
                                                                <p style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.82rem', color: WARM_WHITE, letterSpacing: '0.04em', marginBottom: '8px' }}>
                                                                    {exerciseName}
                                                                </p>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    {exSets.map((s, idx) => (
                                                                        <div key={idx} style={{
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                            padding: '8px 12px',
                                                                            background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
                                                                            border: '1px solid rgba(255,255,255,0.05)'
                                                                        }}>
                                                                            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'Outfit', fontWeight: 600 }}>
                                                                                SET {s.set_number}
                                                                            </span>
                                                                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.88rem', fontFamily: 'Outfit', fontWeight: 700, color: '#fff' }}>
                                                                                    <Weight size={13} color="rgba(255,215,170,0.5)" />{s.weight} kg
                                                                                </span>
                                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.88rem', fontFamily: 'Outfit', fontWeight: 700, color: '#fff' }}>
                                                                                    <Repeat size={13} color="rgba(255,215,170,0.5)" />{s.reps} reps
                                                                                </span>
                                                                                {s.rpe && (
                                                                                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,215,170,0.5)', fontFamily: 'Outfit', fontWeight: 600 }}>
                                                                                        RPE {s.rpe}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════════════════════════════════════════════════════════ */}
            {/* TAB: DIARIO ALIMENTARE                                      */}
            {/* ═══════════════════════════════════════════════════════════ */}
            {activeTab === 'diario' && (
                <div>
                    {dietLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit' }}>Caricamento diario…</div>
                    ) : dailyLogs.length === 0 ? (
                        <div style={{
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                            borderRadius: '20px', padding: '40px', textAlign: 'center'
                        }}>
                            <Utensils size={36} color="rgba(255,255,255,0.15)" style={{ margin: '0 auto 12px' }} />
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit' }}>Nessun giorno registrato.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {dailyLogs.map(log => {
                                const isOpen = expandedDay === log.id;
                                const meals = dayMeals[log.id];
                                const dotColor = completionColor(log.completion_status);

                                return (
                                    <div key={log.id} style={{
                                        background: 'linear-gradient(135deg, rgba(22,20,18,0.85) 0%, rgba(12,10,10,0.95) 100%)',
                                        borderTop: `1px solid ${isOpen ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)'}`,
                                        borderLeft: '1px solid rgba(255,255,255,0.03)',
                                        borderRight: '1px solid rgba(0,0,0,0.5)',
                                        borderBottom: '2px solid rgba(0,0,0,0.7)',
                                        borderRadius: '18px', overflow: 'hidden',
                                        boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
                                    }}>
                                        {/* Day Header */}
                                        <div onClick={() => toggleDay(log.id)} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '14px 18px', cursor: 'pointer',
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                {/* Status dot */}
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: dotColor, flexShrink: 0, boxShadow: `0 0 6px ${dotColor}` }} />
                                                <div>
                                                    <p style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '3px' }}>
                                                        {fmtDate(log.log_date)}
                                                    </p>
                                                    {/* Macro summary */}
                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                        <span style={{ fontSize: '0.72rem', fontFamily: 'Outfit', fontWeight: 600, color: 'rgba(255,215,170,0.7)' }}>{Math.round(log.total_calories)} kcal</span>
                                                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>P: {Math.round(log.total_protein)}g</span>
                                                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>C: {Math.round(log.total_carbs)}g</span>
                                                        <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>G: {Math.round(log.total_fat)}g</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ color: 'rgba(255,255,255,0.3)' }}>
                                                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </div>
                                        </div>

                                        {/* Expanded Meals */}
                                        {isOpen && (
                                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '0 18px 18px' }}>
                                                {!meals ? (
                                                    <p style={{ color: 'rgba(255,255,255,0.3)', padding: '16px 0', textAlign: 'center', fontSize: '0.85rem' }}>Caricamento…</p>
                                                ) : meals.length === 0 ? (
                                                    <p style={{ color: 'rgba(255,255,255,0.25)', padding: '16px 0', textAlign: 'center', fontSize: '0.85rem' }}>Nessun pasto registrato.</p>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '14px' }}>
                                                        {meals.map(meal => {
                                                            const items = meal.log_meal_items || [];
                                                            if (items.length === 0) return null;
                                                            return (
                                                                <div key={meal.id}>
                                                                    <p style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.78rem', color: 'rgba(255,215,170,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                                                                        {MEAL_LABELS[meal.meal_type] || meal.custom_name || meal.meal_type}
                                                                    </p>
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                        {items.map((item, idx) => (
                                                                            <div key={idx} style={{
                                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                                padding: '8px 12px',
                                                                                background: 'rgba(255,255,255,0.03)',
                                                                                border: '1px solid rgba(255,255,255,0.05)',
                                                                                borderRadius: '10px'
                                                                            }}>
                                                                                <div>
                                                                                    <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 500 }}>
                                                                                        {item.food_items?.name || item.custom_food_name || 'Alimento'}
                                                                                    </p>
                                                                                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{item.grams}g</p>
                                                                                </div>
                                                                                <div style={{ textAlign: 'right' }}>
                                                                                    <p style={{ fontSize: '0.85rem', fontFamily: 'Outfit', fontWeight: 700, color: 'rgba(255,215,170,0.85)' }}>{Math.round(item.calories)} kcal</p>
                                                                                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>P:{Math.round(item.protein)} C:{Math.round(item.carbs)} G:{Math.round(item.fat)}</p>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminAthleteDetail;
