import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useAthleteData } from '../../hooks/useAthleteData';
import { useGamification } from '../../hooks/useGamification';
import { generateRecommendation, parseRepRange } from '../../engine/progressionEngine';
import Timer from '../../components/ui/Timer';
import PostWorkoutCheckin from '../../components/user/PostWorkoutCheckin';
import EquipmentClarification from '../../components/user/EquipmentClarification';
import { PlaySquare, Edit3, ArrowLeft, History, Lightbulb, TrendingUp, Shield, AlertTriangle, HelpCircle, Footprints, Utensils, ChevronUp, Check, Loader, Dumbbell, X } from 'lucide-react';

// ── Warm white constant ──
const WARM_WHITE = '#FFF5E6';
const WARM_PEACH_RGBA = 'rgba(255, 215, 170';

const ActiveWorkout = () => {
    const params = useParams();
    const [preservedId, setPreservedId] = useState(params.id);

    useEffect(() => {
        if (params.id) setPreservedId(params.id);
    }, [params.id]);

    const id = params.id || preservedId;
    const navigate = useNavigate();
    const { user } = useAuth();
    const { completeDailyTask } = useGamification();
    const { isLoading: programLoading, program } = useAthleteData();

    const day = program?.days?.find(d => d.id === id) ?? null;

    const [activeExerciseIdx, setActiveExerciseIdx] = useState(0);
    const [showCheckin, setShowCheckin] = useState(false);
    const [showClarification, setShowClarification] = useState(false);
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    const [showVideo, setShowVideo] = useState(false);

    const [sessionId, setSessionId] = useState(null);
    const [exerciseHistory, setExerciseHistory] = useState([]);
    const [todaySets, setTodaySets] = useState([]);
    const [loggingSet, setLoggingSet] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        if (!user || !day) return;
        (async () => {
            const today = new Date().toISOString().split('T')[0];
            const { data: existing } = await supabase
                .from('workout_sessions').select('id')
                .eq('athlete_id', user.id).eq('program_day_id', day.id)
                .is('completed_at', null).gte('started_at', today + 'T00:00:00')
                .limit(1).maybeSingle();

            if (existing) {
                setSessionId(existing.id);
            } else {
                const { data: newSession, error } = await supabase
                    .from('workout_sessions')
                    .insert({ athlete_id: user.id, program_day_id: day.id })
                    .select('id').single();
                if (!error) setSessionId(newSession.id);
            }
        })();
    }, [user?.id, day?.id]);

    const exercise = day?.exercises[activeExerciseIdx];

    const fetchHistory = useCallback(async () => {
        if (!exercise?.exerciseId || !user) return;
        setHistoryLoading(true);
        try {
            const { data: histSets } = await supabase
                .from('logbook_sets')
                .select('set_number, weight, reps, rpe, created_at, session_id, workout_sessions!inner(completed_at, started_at)')
                .eq('exercise_id', exercise.exerciseId)
                .not('workout_sessions.completed_at', 'is', null)
                .order('created_at', { ascending: false }).limit(20);

            if (histSets && histSets.length > 0) {
                const bySession = {};
                histSets.forEach(s => { if (!bySession[s.session_id]) bySession[s.session_id] = []; bySession[s.session_id].push(s); });
                const latestSets = (bySession[Object.keys(bySession)[0]] || []).sort((a, b) => a.set_number - b.set_number);
                setExerciseHistory(latestSets.map(s => ({ weight: s.weight, reps: s.reps, date: s.created_at?.split('T')[0] || '' })));
            } else {
                setExerciseHistory([]);
            }
            if (sessionId) {
                const { data: todayData } = await supabase.from('logbook_sets')
                    .select('set_number, weight, reps')
                    .eq('session_id', sessionId).eq('exercise_id', exercise.exerciseId).order('set_number');
                setTodaySets(todayData || []);
            }
        } catch (err) { setExerciseHistory([]); }
        setHistoryLoading(false);
    }, [exercise?.exerciseId, sessionId, user?.id]);

    useEffect(() => { fetchHistory(); }, [fetchHistory]);

    if (programLoading) {
        return (
            <div className="global-container" style={{ paddingTop: '40px', alignItems: 'center', backgroundColor: '#070709', minHeight: '100vh' }}>
                <div className="animate-pulse" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>
                    Caricamento allenamento…
                </div>
            </div>
        );
    }

    if (!day) return (
        <div className="global-container" style={{ paddingTop: '40px', backgroundColor: '#070709', minHeight: '100vh', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
            Allenamento non trovato.
        </div>
    );

    if (!exercise) {
        return (
            <div className="global-container" style={{ paddingTop: '40px', backgroundColor: '#070709', minHeight: '100vh', alignItems: 'center' }}>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(22,20,18,0.9) 0%, rgba(12,10,10,0.95) 100%)',
                    borderTop: '1px solid rgba(255,215,170,0.1)', borderRadius: '22px',
                    padding: '48px 32px', textAlign: 'center',
                    boxShadow: '0 16px 40px rgba(0,0,0,0.7)'
                }}>
                    <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nessun esercizio presente in questo giorno.</p>
                    <button onClick={() => navigate('/dashboard')} style={{
                        marginTop: '24px', padding: '12px 32px',
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '12px', color: '#fff', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 700
                    }}>
                        Torna alla Dashboard
                    </button>
                </div>
            </div>
        );
    }

    /* ── Progression Engine ── */
    const recommendation = (() => {
        const historyForEngine = exerciseHistory.map(h => ({ date: h.date, weight: h.weight, reps: h.reps }));
        // Read confirmed increments from localStorage
        const confirmedIncrements = JSON.parse(localStorage.getItem('csv_confirmed_increments') || '{}');
        return generateRecommendation({
            exerciseHistory: historyForEngine,
            repRangeStr: exercise.reps,
            programmedSets: exercise.sets,
            exerciseCategory: 'barbell',
            confirmedIncrement: confirmedIncrements[exercise.exerciseId] ?? null,
            stepsToday: 0,
            stepsHistory: [],
            nutritionAdherence: 1,
        });
    })();

    const handleLogSet = async () => {
        if (!weight || !reps || !sessionId) return;
        setLoggingSet(true);
        const setNumber = todaySets.length + 1;
        const { error } = await supabase.from('logbook_sets').insert({
            session_id: sessionId, program_exercise_id: exercise.id,
            exercise_id: exercise.exerciseId, set_number: setNumber,
            weight: parseFloat(weight), reps: parseInt(reps, 10),
        });
        if (!error) setTodaySets(prev => [...prev, { set_number: setNumber, weight: parseFloat(weight), reps: parseInt(reps, 10) }]);
        setWeight(''); setReps(''); setLoggingSet(false);
    };

    const handleWorkoutComplete = async () => {
        if (sessionId) {
            await supabase.from('workout_sessions').update({ completed_at: new Date().toISOString() }).eq('id', sessionId);
        }
        if (completeDailyTask) completeDailyTask('workout');
        navigate('/dashboard');
    };

    const handleCheckinSubmit = async (checkinData) => {
        if (sessionId) {
            await supabase.from('workout_checkins').insert({
                athlete_id: user.id, session_id: sessionId,
                pump_rating: checkinData.pump === 'Low' ? 1 : checkinData.pump === 'Medium' ? 3 : 5,
                energy_rating: checkinData.energy === 'Low' ? 1 : checkinData.energy === 'Medium' ? 3 : 5,
                difficulty: checkinData.difficulty
            });
        }
        setShowCheckin(false); navigate('/dashboard');
    };

    const handleEquipmentConfirm = (increment) => {
        // Store confirmed increment in localStorage
        const existing = JSON.parse(localStorage.getItem('csv_confirmed_increments') || '{}');
        existing[exercise.exerciseId] = increment;
        localStorage.setItem('csv_confirmed_increments', JSON.stringify(existing));
        setShowClarification(false);
    };

    const getRecommendationTag = () => {
        switch (recommendation.recommendation_type) {
            case 'increase_load': return { label: 'AUMENTA CARICO', color: '#00f2fe', icon: <TrendingUp size={14} /> };
            case 'increase_reps': return { label: 'AUMENTA REPS', color: '#a78bfa', icon: <ChevronUp size={14} /> };
            case 'maintain': return { label: 'MANTIENI', color: WARM_WHITE, icon: <Shield size={14} /> };
            case 'stabilize': return { label: 'STABILIZZA', color: '#ff9a9e', icon: <AlertTriangle size={14} /> };
            case 'baseline_needed': return { label: 'BASELINE', color: 'rgba(255,255,255,0.4)', icon: <HelpCircle size={14} /> };
            default: return { label: 'RACCOMANDAZIONE', color: WARM_WHITE, icon: <Lightbulb size={14} /> };
        }
    };

    const getConfidenceBadge = () => {
        const colors = { high: '#22c55e', medium: '#eab308', inferred: '#22c55e', conflicting: '#ef4444' };
        const labels = { high: 'Verificata', medium: 'Buona', inferred: null, conflicting: 'Da verificare' };
        const c = recommendation.confidence_level;
        return { color: colors[c] || '#666', label: labels[c] || null, visible: c !== 'inferred' };
    };

    const tag = getRecommendationTag();
    const conf = getConfidenceBadge();
    const totalExercises = day.exercises.length;

    return (
        <div className="global-container" style={{
            paddingBottom: '120px',
            backgroundColor: '#070709',
            backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(255, 120, 0, 0.06) 0%, transparent 55%)',
            minHeight: '100vh',
            paddingLeft: '16px', paddingRight: '16px',
            paddingTop: '16px'
        }}>
            {/* ── HEADER ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }} className="animate-fade-in">
                <button onClick={() => navigate(-1)} style={{
                    width: '40px', height: '40px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(145deg, rgba(35,30,28,1), rgba(20,16,14,1))',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.06), 0 4px 8px rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)'
                }}>
                    <ArrowLeft size={20} />
                </button>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: '0.68rem', fontFamily: 'Outfit', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,215,170,0.6)' }}>
                        MODALITÀ ALLENAMENTO
                    </p>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{day.name}</p>
                </div>
                <div style={{ width: 40 }} />
            </div>

            {/* ── EXERCISE PROGRESS INDICATOR ── */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '28px' }} className="animate-fade-in">
                {day.exercises.map((_, i) => (
                    <div key={i} onClick={() => setActiveExerciseIdx(i)} style={{
                        width: i === activeExerciseIdx ? '28px' : '8px', height: '8px',
                        borderRadius: '4px', cursor: 'pointer',
                        background: i === activeExerciseIdx
                            ? 'linear-gradient(90deg, #FFF5E6, rgba(255,215,170,0.7))'
                            : i < activeExerciseIdx ? 'rgba(255,215,170,0.3)' : 'rgba(255,255,255,0.12)',
                        transition: 'all 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                        boxShadow: i === activeExerciseIdx ? '0 0 8px rgba(255,215,170,0.4)' : 'none'
                    }} />
                ))}
            </div>

            {/* ── MAIN EXERCISE CARD ── */}
            <div className="animate-fade-in" style={{
                background: 'linear-gradient(135deg, rgba(22,20,18,0.9) 0%, rgba(12,10,10,0.97) 100%)',
                borderTop: '1px solid rgba(255,215,170,0.15)', borderLeft: '1px solid rgba(255,215,170,0.05)',
                borderRight: '1px solid rgba(0,0,0,0.6)', borderBottom: '2px solid rgba(0,0,0,0.9)',
                borderRadius: '24px', padding: '28px 24px',
                boxShadow: '0 16px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.03)',
                marginBottom: '16px', position: 'relative', overflow: 'hidden'
            }}>
                {/* exercise counter */}
                <div style={{
                    position: 'absolute', top: '20px', right: '20px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '20px', padding: '3px 10px',
                    fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'Outfit', fontWeight: 600
                }}>
                    {activeExerciseIdx + 1} / {totalExercises}
                </div>

                {/* Exercise Name */}
                <p style={{ fontSize: '0.7rem', letterSpacing: '0.14em', fontFamily: 'Outfit', fontWeight: 600, color: 'rgba(255,215,170,0.55)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    ESERCIZIO
                </p>
                <h1 style={{
                    fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.7rem',
                    color: WARM_WHITE, lineHeight: 1.2, letterSpacing: '-0.01em',
                    textShadow: '0 0 30px rgba(255,215,170,0.2)', marginBottom: '20px'
                }}>
                    {exercise.name}
                </h1>

                {/* Sets × Reps — Big and visible */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                    {/* Sets */}
                    <div style={{
                        flex: 1, background: 'linear-gradient(145deg, rgba(40,36,32,1), rgba(22,18,16,1))',
                        borderTop: '1px solid rgba(255,215,170,0.2)', borderLeft: '1px solid rgba(255,215,170,0.08)',
                        borderRight: '1px solid rgba(0,0,0,0.4)', borderBottom: '2px solid rgba(0,0,0,0.7)',
                        borderRadius: '16px', padding: '16px', textAlign: 'center',
                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4), 0 4px 10px rgba(0,0,0,0.4)'
                    }}>
                        <p style={{ fontSize: '0.65rem', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.35)', fontFamily: 'Outfit', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>SERIE</p>
                        <p style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '2.2rem', color: WARM_WHITE, lineHeight: 1 }}>{exercise.sets}</p>
                    </div>
                    {/* Separator */}
                    <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '1.4rem', fontWeight: 300 }}>×</div>
                    {/* Reps */}
                    <div style={{
                        flex: 1, background: 'linear-gradient(145deg, rgba(40,36,32,1), rgba(22,18,16,1))',
                        borderTop: '1px solid rgba(255,215,170,0.2)', borderLeft: '1px solid rgba(255,215,170,0.08)',
                        borderRight: '1px solid rgba(0,0,0,0.4)', borderBottom: '2px solid rgba(0,0,0,0.7)',
                        borderRadius: '16px', padding: '16px', textAlign: 'center',
                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4), 0 4px 10px rgba(0,0,0,0.4)'
                    }}>
                        <p style={{ fontSize: '0.65rem', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.35)', fontFamily: 'Outfit', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>REPS</p>
                        <p style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '2.2rem', color: WARM_WHITE, lineHeight: 1 }}>{exercise.reps}</p>
                    </div>
                    {/* Rest */}
                    <div style={{
                        flex: 1, background: 'linear-gradient(145deg, rgba(35,32,30,1), rgba(20,18,16,1))',
                        borderTop: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px', textAlign: 'center',
                        boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.4)'
                    }}>
                        <p style={{ fontSize: '0.65rem', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.3)', fontFamily: 'Outfit', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>RIPOSO</p>
                        <p style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.6rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1 }}>{exercise.rest}<span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'rgba(255,255,255,0.3)', marginLeft: '2px' }}>s</span></p>
                    </div>
                </div>

                {/* Video Tutorial Button */}
                {exercise.videoUrl && (
                    <button onClick={() => setShowVideo(true)} style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        background: 'linear-gradient(135deg, rgba(232,244,248,0.08) 0%, rgba(200,230,240,0.03) 100%)',
                        border: '1px solid rgba(232,244,248,0.25)', borderRadius: '14px',
                        padding: '12px', cursor: 'pointer', color: '#E8F4F8',
                        fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.06em'
                    }}>
                        <PlaySquare size={18} /> VIDEO TUTORIAL
                    </button>
                )}
            </div>

            {/* ── PROGRESSION ENGINE (STANDBY) ── */}
            {/* -- PROGRESSION ENGINE (STANDBY) -- */}
            {/* ── TODAY'S LOGGED SETS ── */}
            {todaySets.length > 0 && (
        <div className="animate-fade-in" style={{
            background: 'linear-gradient(135deg, rgba(20, 28, 20, 0.85) 0%, rgba(10, 16, 10, 0.95) 100%)',
            borderTop: '1px solid rgba(34,197,94,0.2)', borderRadius: '20px', padding: '18px 20px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)', marginBottom: '16px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Check size={16} color="#22c55e" />
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.88rem', color: '#22c55e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    Serie Registrate Oggi
                </h3>
                <span style={{ marginLeft: 'auto', fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.9rem', color: '#22c55e' }}>
                    {todaySets.length} / {exercise.sets}
                </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {todaySets.map((set, idx) => (
                    <div key={idx} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '10px 14px',
                        background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)',
                        borderRadius: '10px'
                    }}>
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.82rem', fontFamily: 'Outfit', fontWeight: 600 }}>SET {set.set_number}</span>
                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', fontFamily: 'Outfit' }}>{set.weight} kg × {set.reps}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

{/* ── REGISTER SET FORM ── */ }
<div className="animate-fade-in" style={{
    background: 'linear-gradient(135deg, rgba(22,20,18,0.9) 0%, rgba(12,10,10,0.97) 100%)',
    borderTop: '1px solid rgba(255,215,170,0.12)', borderRadius: '20px', padding: '20px',
    boxShadow: '0 12px 30px rgba(0,0,0,0.6)', marginBottom: '16px'
}}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Edit3 size={15} color={WARM_WHITE} />
        <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.95rem', color: WARM_WHITE, letterSpacing: '0.06em' }}>
            REGISTRA SERIE
        </h3>
    </div>
    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
        {/* Weight Input */}
        <div style={{ flex: 1, position: 'relative' }}>
            <input
                type="number" placeholder="Peso" value={weight} onChange={e => setWeight(e.target.value)}
                style={{
                    width: '100%', padding: '14px 14px 8px 14px', boxSizing: 'border-box',
                    background: 'linear-gradient(145deg, rgba(18,14,12,1), rgba(10,8,7,1))',
                    border: '1px solid rgba(255,215,170,0.12)', borderBottom: '2px solid rgba(0,0,0,0.8)',
                    borderRadius: '14px', color: '#fff', fontFamily: 'Outfit', fontWeight: 800,
                    fontSize: '1.3rem', textAlign: 'center',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
                    outline: 'none', appearance: 'textfield'
                }}
            />
            <p style={{ position: 'absolute', bottom: '6px', left: 0, right: 0, textAlign: 'center', fontSize: '0.62rem', fontFamily: 'Outfit', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', pointerEvents: 'none' }}>KG</p>
        </div>
        {/* Reps Input */}
        <div style={{ flex: 1, position: 'relative' }}>
            <input
                type="number" placeholder="Reps" value={reps} onChange={e => setReps(e.target.value)}
                style={{
                    width: '100%', padding: '14px 14px 8px 14px', boxSizing: 'border-box',
                    background: 'linear-gradient(145deg, rgba(18,14,12,1), rgba(10,8,7,1))',
                    border: '1px solid rgba(255,215,170,0.12)', borderBottom: '2px solid rgba(0,0,0,0.8)',
                    borderRadius: '14px', color: '#fff', fontFamily: 'Outfit', fontWeight: 800,
                    fontSize: '1.3rem', textAlign: 'center',
                    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
                    outline: 'none', appearance: 'textfield'
                }}
            />
            <p style={{ position: 'absolute', bottom: '6px', left: 0, right: 0, textAlign: 'center', fontSize: '0.62rem', fontFamily: 'Outfit', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', pointerEvents: 'none' }}>REPS</p>
        </div>
    </div>
    <button fullWidth onClick={handleLogSet} disabled={loggingSet || !weight || !reps} style={{
        width: '100%', padding: '16px',
        background: weight && reps
            ? 'linear-gradient(135deg, rgba(255,215,170,0.18) 0%, rgba(255,195,140,0.08) 100%)'
            : 'rgba(255,255,255,0.04)',
        border: `1px solid ${weight && reps ? 'rgba(255,215,170,0.4)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: '14px', cursor: weight && reps ? 'pointer' : 'not-allowed',
        color: weight && reps ? WARM_WHITE : 'rgba(255,255,255,0.3)',
        fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.08em',
        boxShadow: weight && reps ? '0 4px 16px rgba(0,0,0,0.4)' : 'none',
        transition: 'all 0.2s ease'
    }}>
        {loggingSet ? <><Loader size={16} style={{ display: 'inline', marginRight: '8px' }} />Salvataggio…</> : 'REGISTRA SERIE'}
    </button>
</div>

{/* ── REST TIMER ── */ }
<div className="animate-fade-in" style={{
    background: 'linear-gradient(135deg, rgba(15,12,10,0.8) 0%, rgba(8,6,5,0.95) 100%)',
    borderTop: '1px solid rgba(255,215,170,0.1)', borderRadius: '20px', padding: '20px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.6)', marginBottom: '16px'
}}>
    <h3 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '0.82rem', letterSpacing: '0.18em', textTransform: 'uppercase', textAlign: 'center', color: 'rgba(255,255,255,0.35)', marginBottom: '14px' }}>
        TIMER RIPOSO
    </h3>
    <Timer initialSeconds={exercise.rest} />
</div>

{/* ── PREVIOUS PERFORMANCE ── */ }
<div className="animate-fade-in" style={{
    background: 'linear-gradient(135deg, rgba(18,16,14,0.8) 0%, rgba(10,8,6,0.95) 100%)',
    borderTop: '1px solid rgba(255,215,170,0.1)', borderRadius: '20px', padding: '18px 20px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.5)', marginBottom: '16px'
}}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <History size={15} color="rgba(255,215,170,0.5)" />
        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.82rem', color: 'rgba(255,215,170,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Ultimo Allenamento
        </h3>
        {exerciseHistory.length > 0 && (
            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)' }}>
                {new Date(exerciseHistory[0].date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
            </span>
        )}
    </div>
    {historyLoading ? (
        <div style={{ textAlign: 'center', padding: '12px' }}>
            <Loader size={18} color="rgba(255,255,255,0.2)" className="animate-pulse" />
        </div>
    ) : exerciseHistory.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {exerciseHistory.map((set, idx) => (
                <div key={idx} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 14px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px'
                }}>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Set {idx + 1}</span>
                    <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem', fontFamily: 'Outfit' }}>{set.weight} kg × {set.reps}</span>
                </div>
            ))}
        </div>
    ) : (
        <p style={{ color: 'rgba(255,255,255,0.2)', textAlign: 'center', padding: '12px 0', fontSize: '0.85rem' }}>
            Nessun dato precedente per questo esercizio.
        </p>
    )}
</div>

{/* ── NAVIGATION ── */ }
<div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }} className="animate-fade-in">
    <button disabled={activeExerciseIdx === 0} onClick={() => setActiveExerciseIdx(prev => prev - 1)} style={{
        flex: 1, padding: '14px', borderRadius: '14px', cursor: activeExerciseIdx === 0 ? 'not-allowed' : 'pointer',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        color: activeExerciseIdx === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
        fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.04em'
    }}>
        ← Precedente
    </button>
    <button disabled={activeExerciseIdx === day.exercises.length - 1} onClick={() => setActiveExerciseIdx(prev => prev + 1)} style={{
        flex: 1, padding: '14px', borderRadius: '14px',
        cursor: activeExerciseIdx === day.exercises.length - 1 ? 'not-allowed' : 'pointer',
        background: activeExerciseIdx < day.exercises.length - 1
            ? 'linear-gradient(135deg, rgba(255,215,170,0.18) 0%, rgba(255,195,140,0.08) 100%)'
            : 'rgba(255,255,255,0.04)',
        border: `1px solid ${activeExerciseIdx < day.exercises.length - 1 ? 'rgba(255,215,170,0.35)' : 'rgba(255,255,255,0.08)'}`,
        color: activeExerciseIdx < day.exercises.length - 1 ? WARM_WHITE : 'rgba(255,255,255,0.2)',
        fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.88rem', letterSpacing: '0.04em'
    }}>
        Successivo →
    </button>
</div>

{/* ── TERMINA ALLENAMENTO ── */ }
{
    activeExerciseIdx === day.exercises.length - 1 && (
        <button onClick={handleWorkoutComplete} className="animate-fade-in" style={{
            width: '100%', padding: '18px',
            background: 'linear-gradient(135deg, rgba(22,20,18,0.9) 0%, rgba(12,10,10,0.97) 100%)',
            border: '1px solid rgba(255,215,170,0.25)', borderBottom: '2px solid rgba(0,0,0,0.8)',
            borderRadius: '16px', cursor: 'pointer',
            color: WARM_WHITE, fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,215,170,0.08)'
        }}>
            TERMINA ALLENAMENTO
        </button>
    )
}

{/* ── MODALS ── */ }
{ showCheckin && <PostWorkoutCheckin workoutName={day.name} onSubmit={handleCheckinSubmit} /> }

{
    showClarification && recommendation.clarification_question && (
        <EquipmentClarification
            question={recommendation.clarification_question}
            onConfirm={handleEquipmentConfirm}
            onDismiss={() => setShowClarification(false)}
        />
    )
}

{
    showVideo && exercise.videoUrl && (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)', padding: '20px'
        }} onClick={() => setShowVideo(false)}>
            <div style={{ width: '100%', maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                {exercise.videoUrl.includes('youtube.com') || exercise.videoUrl.includes('youtu.be') ? (
                    <iframe 
                        src={exercise.videoUrl.replace('watch?v=', 'embed/').split('&')[0].replace('youtu.be/', 'youtube.com/embed/')} 
                        style={{ width: '100%', aspectRatio: '16/9', borderRadius: '16px', border: '1px solid rgba(255,215,170,0.1)' }} 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen 
                    />
                ) : (
                    <video src={exercise.videoUrl} controls autoPlay playsInline style={{ width: '100%', borderRadius: '16px', maxHeight: '70vh', border: '1px solid rgba(255,215,170,0.1)' }} />
                )}
                <button onClick={() => setShowVideo(false)} style={{
                    marginTop: '12px', width: '100%', padding: '14px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', color: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.9rem'
                }}>
                    Chiudi
                </button>
            </div>
        </div>
    )
}
        </div >
    );
};

export default ActiveWorkout;
