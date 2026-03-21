import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import {
    Plus, Trash2, ArrowUp, ArrowDown, Zap, Copy,
    UserPlus, Save, ChevronRight, Video, Link2,
    Check, Trash, X, Loader
} from 'lucide-react';
import ExercisePicker from '../../components/admin/ExercisePicker';
import TechNotePopup from '../../components/admin/TechNotePopup';

// crypto.randomUUID() requires HTTPS — use a manual polyfill for HTTP/local dev
const uid = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback: RFC 4122 v4 UUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

const ProgramBuilder = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    /* ── State ── */
    const [activeDayIdx, setActiveDayIdx] = useState(0);
    const [program, setProgram] = useState({
        name: 'Nuovo Programma',
        days: [
            { id: uid(), dayCode: 'A', name: 'Giorno A', exercises: [] }
        ]
    });
    const [showPicker, setShowPicker] = useState(false);
    const [techNoteModal, setTechNoteModal] = useState(null);
    const [showAssign, setShowAssign] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    const [saving, setSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(!!id && id !== 'new');
    const [athletes, setAthletes] = useState([]);
    const [programId, setProgramId] = useState(id && id !== 'new' ? id : null);

    /* ── Load existing program from Supabase if editing ── */
    useEffect(() => {
        if (!id || id === 'new') return;

        (async () => {
            setIsLoading(true);
            // Fetch program
            const { data: prog, error: pErr } = await supabase
                .from('programs')
                .select('id, name')
                .eq('id', id)
                .single();

            if (pErr || !prog) {
                console.error('[ProgramBuilder] Load error:', pErr?.message);
                setIsLoading(false);
                return;
            }

            // Fetch days
            const { data: days } = await supabase
                .from('program_days')
                .select('id, name, day_order')
                .eq('program_id', id)
                .order('day_order');

            // Fetch exercises for all days
            const enrichedDays = await Promise.all(
                (days || []).map(async (day, idx) => {
                    const { data: exs } = await supabase
                        .from('program_exercises')
                        .select(`id, exercise_id, sets, reps, rest_seconds, notes, order_index, exercises ( id, name, primary_muscle_group, video_url )`)
                        .eq('day_id', day.id)
                        .order('order_index');

                    const codes = 'ABCDEFGHIJKLMNOP';
                    return {
                        id: day.id,
                        dayCode: codes[idx] || (idx + 1).toString(),
                        name: day.name,
                        exercises: (exs || []).map(pe => ({
                            id: pe.id,
                            exerciseId: pe.exercise_id,
                            exerciseName: pe.exercises?.name ?? 'Sconosciuto',
                            muscleGroup: pe.exercises?.primary_muscle_group ?? '',
                            hasVideo: !!pe.exercises?.video_url,
                            sets: pe.sets ?? 3,
                            reps: pe.reps ?? '10',
                            rest: pe.rest_seconds ?? 90,
                            noteType: pe.notes ? 'custom' : null,
                            noteText: pe.notes ?? '',
                            linkedSupersetId: null,
                        })),
                    };
                })
            );

            setProgramId(prog.id);
            setProgram({
                name: prog.name,
                days: enrichedDays.length > 0 ? enrichedDays : [{ id: uid(), dayCode: 'A', name: 'Giorno A', exercises: [] }],
            });
            setIsLoading(false);
        })();
    }, [id]);

    /* ── Fetch athletes for assign modal ── */
    useEffect(() => {
        (async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .eq('role', 'athlete')
                .order('full_name');
            setAthletes(data || []);
        })();
    }, []);

    /* ── Day handlers ── */
    const addDay = () => {
        const codes = 'ABCDEFGHIJKLMNOP';
        const nextCode = codes[program.days.length] || (program.days.length + 1).toString();
        const newDay = { id: uid(), dayCode: nextCode, name: `Giorno ${nextCode}`, exercises: [] };
        setProgram({ ...program, days: [...program.days, newDay] });
        setActiveDayIdx(program.days.length);
    };

    const removeDay = (idx) => {
        if (program.days.length <= 1) return;
        const newDays = program.days.filter((_, i) => i !== idx);
        setProgram({ ...program, days: newDays });
        setActiveDayIdx(Math.max(0, idx - 1));
    };

    /* ── Exercise handlers ── */
    const handleAddExercise = (baseEx) => {
        const newEx = {
            id: uid(),
            exerciseId: baseEx.id,
            exerciseName: baseEx.name,
            muscleGroup: baseEx.primary_muscle_group || '',
            hasVideo: !!baseEx.video_url,
            order: program.days[activeDayIdx].exercises.length,
            sets: 3,
            reps: '10',
            rest: 90,
            noteType: null,
            noteText: '',
            linkedSupersetId: null,
        };
        const newDays = [...program.days];
        newDays[activeDayIdx].exercises.push(newEx);
        setProgram({ ...program, days: newDays });
    };

    const updateEx = (exIdx, fields) => {
        const newDays = [...program.days];
        newDays[activeDayIdx].exercises[exIdx] = { ...newDays[activeDayIdx].exercises[exIdx], ...fields };
        setProgram({ ...program, days: newDays });
    };

    const moveEx = (exIdx, dir) => {
        const newDays = [...program.days];
        const exercises = newDays[activeDayIdx].exercises;
        const newIdx = exIdx + dir;
        if (newIdx < 0 || newIdx >= exercises.length) return;
        [exercises[exIdx], exercises[newIdx]] = [exercises[newIdx], exercises[exIdx]];
        setProgram({ ...program, days: newDays });
    };

    const handleDuplicateEx = (exIdx) => {
        const newDays = [...program.days];
        const src = newDays[activeDayIdx].exercises[exIdx];
        const clone = { ...src, id: uid(), order: newDays[activeDayIdx].exercises.length };
        newDays[activeDayIdx].exercises.push(clone);
        setProgram({ ...program, days: newDays });
    };

    /* ── SAVE TO SUPABASE ── */
    const handleSave = async () => {
        if (saving) return;
        setSaving(true);

        try {
            let currentProgramId = programId;

            if (currentProgramId) {
                // UPDATE existing program name
                await supabase.from('programs').update({ name: program.name }).eq('id', currentProgramId);

                // Delete old days + exercises (cascade will handle program_exercises)
                await supabase.from('program_days').delete().eq('program_id', currentProgramId);
            } else {
                // CREATE new program
                const { data: newProg, error: createErr } = await supabase
                    .from('programs')
                    .insert({ name: program.name })
                    .select('id')
                    .single();

                if (createErr) throw createErr;
                currentProgramId = newProg.id;
                setProgramId(currentProgramId);
            }

            // Insert days + exercises
            for (let dayIdx = 0; dayIdx < program.days.length; dayIdx++) {
                const day = program.days[dayIdx];

                const { data: newDay, error: dayErr } = await supabase
                    .from('program_days')
                    .insert({
                        program_id: currentProgramId,
                        name: day.name,
                        day_order: dayIdx,
                    })
                    .select('id')
                    .single();

                if (dayErr) throw dayErr;

                // Insert exercises for this day
                if (day.exercises.length > 0) {
                    const exerciseRows = day.exercises.map((ex, exIdx) => ({
                        day_id: newDay.id,
                        exercise_id: ex.exerciseId,
                        sets: ex.sets || 3,
                        reps: ex.reps || '10',
                        rest_seconds: ex.rest || 90,
                        notes: ex.noteText || null,
                        order_index: exIdx,
                    }));

                    const { error: exErr } = await supabase.from('program_exercises').insert(exerciseRows);
                    if (exErr) throw exErr;
                }
            }

            setSaveStatus('saved');
            setTimeout(() => setSaveStatus(null), 2500);

            // Update URL if new program was created
            if (!id || id === 'new') {
                navigate(`/admin/programs/${currentProgramId}`, { replace: true });
            }
            return currentProgramId;
        } catch (err) {
            console.error('[ProgramBuilder] Save error:', err.message);
            alert('Errore nel salvataggio: ' + err.message);
            return null;
        } finally {
            setSaving(false);
        }
    };

    /* ── ASSIGN TO ATHLETE ── */
    const handleAssign = async (athleteId) => {
        // Auto-salvataggio prima dell'assegnazione
        const savedProgId = await handleSave();

        if (!savedProgId) {
            return; // Salvataggio fallito
        }

        const { error } = await supabase
            .from('athlete_programs')
            .insert({
                athlete_id: athleteId,
                program_id: savedProgId,
                assigned_at: new Date().toISOString(),
            });

        if (error) {
            console.error('[ProgramBuilder] Assign error:', error.message);
            alert('Errore assegnazione: ' + error.message);
        } else {
            setShowAssign(false);
            alert('Programma salvato e assegnato con successo!');
        }
    };

    const activeDay = program.days[activeDayIdx];

    if (isLoading) {
        return (
            <div className="flex-col gap-6" style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '40px', alignItems: 'center' }}>
                <Loader size={24} className="animate-pulse" color="var(--text-muted)" />
                <p className="text-small">Caricamento programma…</p>
            </div>
        );
    }

    return (
        <div className="flex-col gap-6" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '100px' }}>

            {/* ── Top Bar ── */}
            <div className="flex-row justify-between items-center animate-fade-in" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                <div className="flex-col gap-1">
                    <Input
                        variant="transparent"
                        value={program.name}
                        onChange={e => setProgram({ ...program, name: e.target.value })}
                        style={{ fontSize: '1.5rem', fontWeight: 800, padding: 0, height: 'auto', border: 'none' }}
                    />
                    <p className="text-label" style={{ opacity: 0.6 }}>Configurazione Workout</p>
                </div>
                <div className="flex-row gap-2">
                    {programId && (
                        <Button variant="outline" onClick={() => setShowAssign(true)}>
                            <UserPlus size={18} /> Assegna a Cliente
                        </Button>
                    )}
                    <Button onClick={handleSave} variant={saveStatus === 'saved' ? 'teal' : 'primary'} disabled={saving}>
                        {saving ? <Loader size={18} className="animate-pulse" /> : saveStatus === 'saved' ? <><Check size={18} /> Salvato</> : <><Save size={18} /> Salva Programma</>}
                    </Button>
                </div>
            </div>

            <div className="responsive-builder-layout">

                {/* ── Sidebar Days ── */}
                <div className="responsive-builder-sidebar flex-col gap-3">
                    <p className="text-label">Giorni Allenamento</p>
                    {program.days.map((day, idx) => (
                        <div
                            key={day.id}
                            onClick={() => setActiveDayIdx(idx)}
                            className="flex-row items-center justify-between"
                            style={{
                                padding: '12px 14px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                background: activeDayIdx === idx ? 'var(--gradient-primary)' : '#1a1a1a',
                                color: activeDayIdx === idx ? '#fff' : 'var(--text-muted)',
                                border: '1px solid ' + (activeDayIdx === idx ? 'transparent' : '#333'),
                                transition: 'all 0.2s',
                            }}
                        >
                            <div className="flex-row gap-2 items-center">
                                <Badge variant={activeDayIdx === idx ? 'warm' : 'ghost'} style={{ minWidth: '24px', justifyContent: 'center' }}>{day.dayCode}</Badge>
                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{day.name}</span>
                            </div>
                        </div>
                    ))}
                    <Button variant="ghost" fullWidth onClick={addDay} style={{ border: '1px dashed #444', background: '#141414' }}>
                        <Plus size={16} /> Aggiungi Giorno
                    </Button>
                </div>

                {/* ── Day Editor ── */}
                <div style={{ flex: 1 }} className="flex-col gap-4">
                    <div className="flex-row justify-between items-center" style={{ padding: '16px 20px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}>
                        <Input
                            variant="transparent"
                            value={activeDay?.name}
                            onChange={e => {
                                const newDays = [...program.days];
                                newDays[activeDayIdx].name = e.target.value;
                                setProgram({ ...program, days: newDays });
                            }}
                            style={{ fontWeight: 700, fontSize: '1.2rem', padding: 0, border: 'none' }}
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeDay(activeDayIdx)}>
                            <Trash2 size={18} color="var(--accent-coral)" />
                        </Button>
                    </div>

                    <div className="flex-col gap-3">
                        {activeDay?.exercises.map((ex, exIdx) => (
                            <div key={ex.id} className="animate-fade-in" style={{ padding: '12px 16px', background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px' }}>
                                <div className="flex-row gap-3 items-center" style={{ flexWrap: 'wrap' }}>
                                    {/* Order & Title */}
                                    <div className="flex-col items-center gap-1" style={{ width: '32px' }}>
                                        <button onClick={() => moveEx(exIdx, -1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', minWidth: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowUp size={16} /></button>
                                        <span className="text-small" style={{ fontWeight: 800, color: 'var(--accent-warm)' }}>{exIdx + 1}</span>
                                        <button onClick={() => moveEx(exIdx, 1)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', minWidth: '32px', minHeight: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowDown size={16} /></button>
                                    </div>

                                    <div style={{ flex: '2 1 200px' }} className="flex-row gap-2 items-center">
                                        <div>
                                            <p style={{ fontWeight: 700, fontSize: '1rem' }}>{ex.exerciseName}</p>
                                            <div className="flex-row gap-2 items-center">
                                                <Badge variant="ghost" style={{ fontSize: '0.65rem' }}>{(ex.muscleGroup || '').toUpperCase()}</Badge>
                                                {ex.hasVideo && <Video size={12} color="var(--accent-teal)" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Config Inputs */}
                                    <div className="flex-row gap-3" style={{ flex: '1 1 300px', flexWrap: 'wrap' }}>
                                        <div style={{ flex: '1 1 60px', minWidth: '50px' }}>
                                            <label className="text-label" style={{ fontSize: '0.65rem' }}>Serie</label>
                                            <Input variant="compact" type="number" value={ex.sets} onChange={e => updateEx(exIdx, { sets: parseInt(e.target.value) })} style={{ minHeight: '44px' }} />
                                        </div>
                                        <div style={{ flex: '1 1 70px', minWidth: '60px' }}>
                                            <label className="text-label" style={{ fontSize: '0.65rem' }}>Rip</label>
                                            <Input variant="compact" value={ex.reps} onChange={e => updateEx(exIdx, { reps: e.target.value })} style={{ minHeight: '44px' }} />
                                        </div>
                                        <div style={{ flex: '1 1 60px', minWidth: '50px' }}>
                                            <label className="text-label" style={{ fontSize: '0.65rem' }}>Rest</label>
                                            <Input variant="compact" type="number" value={ex.rest} onChange={e => updateEx(exIdx, { rest: parseInt(e.target.value) })} style={{ minHeight: '44px' }} />
                                        </div>

                                        {/* Tech Note Trigger */}
                                        <div style={{ flex: '1 1 120px' }} className="flex-col justify-end">
                                            <Button
                                                variant={ex.noteType ? 'warm' : 'outline'}
                                                size="sm"
                                                fullWidth
                                                onClick={() => setTechNoteModal({ dayIdx: activeDayIdx, exIdx })}
                                                style={{ height: '44px', whiteSpace: 'nowrap', padding: '0 12px' }}
                                            >
                                                {ex.noteType ? <><Zap size={14} /> {ex.noteText}</> : <><Plus size={14} /> Nota Tecn.</>}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex-row gap-1" style={{ flex: '0 0 auto' }}>
                                        <Button variant="ghost" size="icon" onClick={() => handleDuplicateEx(exIdx)} title="Duplica">
                                            <Copy size={14} />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => {
                                            const newDays = [...program.days];
                                            newDays[activeDayIdx].exercises.splice(exIdx, 1);
                                            setProgram({ ...program, days: newDays });
                                        }} title="Elimina">
                                            <Trash size={14} color="var(--accent-coral)" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Linked Superset Indicator */}
                                {ex.linkedSupersetId && (
                                    <div className="flex-row gap-2 items-center" style={{ marginTop: '8px', padding: '6px 10px', background: '#252118', borderRadius: '6px', border: '1px solid #553a00' }}>
                                        <Link2 size={12} color="var(--accent-warm)" />
                                        <span className="text-small" style={{ fontWeight: 600 }}>Linked Superset con Esercizio #{activeDay.exercises.findIndex(e => e.id === ex.linkedSupersetId) + 1}</span>
                                    </div>
                                )}
                            </div>
                        ))}

                        <Button size="lg" variant="secondary" fullWidth style={{ border: '2px dashed rgba(255,255,255,0.06)', height: '60px' }} onClick={() => setShowPicker(true)}>
                            <Plus size={20} /> Aggiungi Esercizio dalla Libreria
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Modals ── */}
            {showPicker && (
                <ExercisePicker
                    onSelect={handleAddExercise}
                    onClose={() => setShowPicker(false)}
                />
            )}

            {techNoteModal && (
                <TechNotePopup
                    exercise={activeDay.exercises[techNoteModal.exIdx]}
                    allExercisesInDay={activeDay.exercises}
                    onSave={(noteFields) => {
                        updateEx(techNoteModal.exIdx, noteFields);
                        setTechNoteModal(null);
                    }}
                    onClose={() => setTechNoteModal(null)}
                />
            )}

            {showAssign && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '20px' }}
                    onClick={() => setShowAssign(false)}
                >
                    <Card
                        className="animate-fade-in flex-col gap-4"
                        style={{ width: '100%', maxWidth: '400px', maxHeight: '90vh', display: 'flex', overflow: 'hidden' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex-row justify-between items-center" style={{ flexShrink: 0 }}>
                            <h2 className="text-h2">Assegna a Cliente</h2>
                            <Button variant="ghost" size="icon" onClick={() => setShowAssign(false)}><X size={20} /></Button>
                        </div>
                        <div className="flex-col gap-2" style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                            {athletes.length === 0 && (
                                <p className="text-small" style={{ textAlign: 'center', padding: '16px' }}>Nessun atleta trovato</p>
                            )}
                            {athletes.map(a => (
                                <div
                                    key={a.id}
                                    onClick={() => handleAssign(a.id)}
                                    className="flex-row justify-between items-center"
                                    style={{ padding: '12px 14px', borderRadius: '10px', background: 'var(--surface-color-2)', cursor: 'pointer' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-color-3)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-color-2)'}
                                >
                                    <div className="flex-col" style={{ flex: 1 }}>
                                        <span style={{ fontWeight: 600 }}>{a.full_name || a.id}</span>
                                        {a.email && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{a.email}</span>}
                                    </div>
                                    <ChevronRight size={16} color="var(--text-muted)" />
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default ProgramBuilder;
