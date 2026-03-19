import { useState, useMemo } from 'react';
import { useAdminLessons } from '../../../hooks/useAdminLessons';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import { Users, User, Calendar, Clock, CheckCircle, Star, ArrowLeft, Loader } from 'lucide-react';

const DAYS_IT = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

const AdminLessonCreate = () => {
    const { admin } = useAdminAuth();
    const { athletes, createLesson, findAvailableSlots } = useAdminLessons();
    const coachId = admin?.id;

    // Wizard steps
    const [step, setStep] = useState(1); // 1=tipo, 2=partecipanti, 3=slot, 4=conferma
    const [lessonType, setLessonType] = useState(null); // 'single' | 'pair'
    const [selectedAthletes, setSelectedAthletes] = useState([]);
    const [duration, setDuration] = useState(60);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [creating, setCreating] = useState(false);
    const [result, setResult] = useState(null); // { success, message }
    const [notes, setNotes] = useState('');

    // Date range for slot search (next 2 weeks)
    const dateRange = useMemo(() => {
        const start = new Date();
        start.setDate(start.getDate() + 1); // da domani
        const end = new Date(start);
        end.setDate(end.getDate() + 13);
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    }, []);

    // Compute available slots
    const availableSlots = useMemo(() => {
        if (!coachId || selectedAthletes.length === 0) return [];
        return findAvailableSlots(
            coachId,
            selectedAthletes.map(a => a.id),
            dateRange.start,
            dateRange.end,
            duration
        );
    }, [coachId, selectedAthletes, dateRange, duration, findAvailableSlots]);

    // Group slots by date
    const groupedSlots = useMemo(() => {
        const groups = {};
        availableSlots.forEach(slot => {
            if (!groups[slot.date]) groups[slot.date] = [];
            groups[slot.date].push(slot);
        });
        return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    }, [availableSlots]);

    const toggleAthlete = (athlete) => {
        const max = lessonType === 'pair' ? 2 : 1;
        setSelectedAthletes(prev => {
            const exists = prev.find(a => a.id === athlete.id);
            if (exists) return prev.filter(a => a.id !== athlete.id);
            if (prev.length >= max) return prev; // max reached
            return [...prev, athlete];
        });
    };

    const filteredAthletes = athletes.filter(a =>
        a.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = async () => {
        setCreating(true);
        const { error } = await createLesson({
            coachId,
            lessonType,
            date: selectedSlot.date,
            startTime: selectedSlot.start_time,
            endTime: selectedSlot.end_time,
            durationMinutes: duration,
            athleteIds: selectedAthletes.map(a => a.id),
            notes: notes || null
        });

        if (error) {
            setResult({ success: false, message: error });
        } else {
            setResult({ success: true, message: 'Lezione creata con successo!' });
        }
        setCreating(false);
        setStep(4);
    };

    const reset = () => {
        setStep(1);
        setLessonType(null);
        setSelectedAthletes([]);
        setSelectedSlot(null);
        setResult(null);
        setNotes('');
    };

    const inputStyle = {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px', padding: '10px 14px',
        color: '#fff', fontFamily: 'Outfit', fontSize: '0.9rem', outline: 'none'
    };

    return (
        <div className="flex-col gap-6 animate-fade-in">
            {/* Progress */}
            <div className="flex-row gap-3 items-center" style={{ marginBottom: '8px' }}>
                {[1, 2, 3, 4].map(s => (
                    <div key={s} style={{
                        flex: 1, height: '4px', borderRadius: '4px',
                        background: s <= step ? 'var(--accent-gold)' : 'rgba(255,255,255,0.06)',
                        transition: 'all 0.3s'
                    }} />
                ))}
            </div>

            {/* STEP 1: Tipo Lezione */}
            {step === 1 && (
                <div className="flex-col gap-4 animate-fade-in">
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.3rem', color: '#fff' }}>
                        Tipo di Lezione
                    </h3>
                    <div className="flex-row gap-4" style={{ flexWrap: 'wrap' }}>
                        {[
                            { type: 'single', icon: <User size={32} />, label: 'Singola', desc: '1 atleta + coach' },
                            { type: 'pair', icon: <Users size={32} />, label: 'Coppia', desc: '2 atleti + coach' }
                        ].map(opt => (
                            <div
                                key={opt.type}
                                onClick={() => { setLessonType(opt.type); setSelectedAthletes([]); setStep(2); }}
                                style={{
                                    flex: '1 1 200px', padding: '32px 24px', textAlign: 'center',
                                    borderRadius: '16px', cursor: 'pointer',
                                    background: lessonType === opt.type ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                                    border: `2px solid ${lessonType === opt.type ? 'var(--accent-gold)' : 'rgba(255,255,255,0.06)'}`,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{ color: lessonType === opt.type ? 'var(--accent-gold)' : 'var(--text-muted)', marginBottom: '12px' }}>
                                    {opt.icon}
                                </div>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{opt.label}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>{opt.desc}</div>
                            </div>
                        ))}
                    </div>

                    {/* Durata */}
                    <div className="flex-row items-center gap-3" style={{ marginTop: '12px' }}>
                        <Clock size={16} color="var(--text-muted)" />
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Durata:</span>
                        <select value={duration} onChange={e => setDuration(parseInt(e.target.value))} style={inputStyle}>
                            <option value={30}>30 min</option>
                            <option value={45}>45 min</option>
                            <option value={60}>60 min</option>
                            <option value={90}>90 min</option>
                            <option value={120}>120 min</option>
                        </select>
                    </div>
                </div>
            )}

            {/* STEP 2: Seleziona Partecipanti */}
            {step === 2 && (
                <div className="flex-col gap-4 animate-fade-in">
                    <div className="flex-row items-center gap-3">
                        <button onClick={() => setStep(1)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.3rem', color: '#fff' }}>
                            Seleziona {lessonType === 'pair' ? '2 Atleti' : '1 Atleta'}
                        </h3>
                    </div>

                    {/* Selected Athletes */}
                    {selectedAthletes.length > 0 && (
                        <div className="flex-row gap-2 flex-wrap">
                            {selectedAthletes.map(a => (
                                <div key={a.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '8px 14px', borderRadius: '20px',
                                    background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)',
                                    color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 600
                                }}>
                                    <CheckCircle size={14} />
                                    {a.full_name}
                                    <button onClick={() => toggleAthlete(a)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>×</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Cerca atleta..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ ...inputStyle, width: '100%', maxWidth: '400px' }}
                    />

                    {/* List */}
                    <div className="flex-col gap-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {filteredAthletes.map(athlete => {
                            const isSelected = selectedAthletes.some(a => a.id === athlete.id);
                            const maxReached = selectedAthletes.length >= (lessonType === 'pair' ? 2 : 1);
                            return (
                                <div
                                    key={athlete.id}
                                    onClick={() => toggleAthlete(athlete)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        padding: '14px 18px', borderRadius: '12px', cursor: maxReached && !isSelected ? 'not-allowed' : 'pointer',
                                        background: isSelected ? 'rgba(212,175,55,0.06)' : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${isSelected ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.04)'}`,
                                        opacity: maxReached && !isSelected ? 0.4 : 1,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {athlete.avatar_url ? (
                                        <img src={athlete.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{
                                            width: 40, height: 40, borderRadius: '50%',
                                            background: 'var(--surface-color-3)', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            color: 'var(--text-muted)', fontWeight: 600, fontSize: '1rem'
                                        }}>
                                            {athlete.full_name?.charAt(0)}
                                        </div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{athlete.full_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{athlete.email}</div>
                                    </div>
                                    {isSelected && <CheckCircle size={20} color="var(--accent-gold)" />}
                                </div>
                            );
                        })}
                    </div>

                    {/* Next Button */}
                    {selectedAthletes.length >= (lessonType === 'pair' ? 2 : 1) && (
                        <button
                            onClick={() => setStep(3)}
                            style={{
                                padding: '14px 28px', borderRadius: '14px',
                                background: 'var(--accent-gold)', border: 'none', color: '#000',
                                fontFamily: 'Outfit', fontSize: '1rem', fontWeight: 700,
                                cursor: 'pointer', alignSelf: 'flex-start',
                                transition: 'all 0.2s'
                            }}
                        >
                            Trova Slot Disponibili →
                        </button>
                    )}
                </div>
            )}

            {/* STEP 3: Seleziona Slot */}
            {step === 3 && (
                <div className="flex-col gap-4 animate-fade-in">
                    <div className="flex-row items-center gap-3">
                        <button onClick={() => setStep(2)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                            <ArrowLeft size={20} />
                        </button>
                        <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.3rem', color: '#fff' }}>
                            Slot Disponibili
                        </h3>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            ({availableSlots.length} trovati nelle prossime 2 settimane)
                        </span>
                    </div>

                    {/* Notes */}
                    <div className="flex-col gap-1" style={{ maxWidth: '500px' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Note (opzionale)</label>
                        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="es. Prima lezione di prova" style={inputStyle} />
                    </div>

                    {groupedSlots.length === 0 ? (
                        <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                            <Calendar size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom: '12px' }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
                                Nessuno slot disponibile trovato nelle prossime 2 settimane.<br />
                                Verifica le disponibilità del coach e degli atleti.
                            </p>
                        </div>
                    ) : (
                        <div className="flex-col gap-4">
                            {groupedSlots.map(([date, daySlots], groupIdx) => (
                                <div key={date}>
                                    <div style={{
                                        fontWeight: 700, fontSize: '0.9rem', color: 'var(--accent-gold)',
                                        marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px'
                                    }}>
                                        <Calendar size={14} />
                                        {DAYS_IT[daySlots[0]?.day_of_week]} {new Date(date + 'T00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                                    </div>
                                    <div className="flex-row gap-2 flex-wrap">
                                        {daySlots.map((slot, idx) => {
                                            const isSelected = selectedSlot?.date === slot.date && selectedSlot?.start_time === slot.start_time;
                                            const isRecommended = groupIdx === 0 && idx === 0; // Primo slot = consigliato
                                            return (
                                                <div
                                                    key={`${slot.date}-${slot.start_time}`}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    style={{
                                                        padding: '12px 18px', borderRadius: '12px', cursor: 'pointer',
                                                        background: isSelected ? 'rgba(212,175,55,0.12)' : 'rgba(255,255,255,0.02)',
                                                        border: `2px solid ${isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.06)'}`,
                                                        transition: 'all 0.2s', position: 'relative'
                                                    }}
                                                >
                                                    {isRecommended && (
                                                        <div style={{
                                                            position: 'absolute', top: '-8px', right: '-8px',
                                                            background: 'var(--accent-gold)', borderRadius: '50%',
                                                            width: '22px', height: '22px', display: 'flex',
                                                            alignItems: 'center', justifyContent: 'center'
                                                        }}>
                                                            <Star size={12} color="#000" fill="#000" />
                                                        </div>
                                                    )}
                                                    <span style={{ fontWeight: 600, color: isSelected ? 'var(--accent-gold)' : '#fff', fontSize: '0.9rem' }}>
                                                        {slot.start_time} – {slot.end_time}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Confirm Button */}
                    {selectedSlot && (
                        <button
                            onClick={handleCreate}
                            disabled={creating}
                            style={{
                                padding: '14px 28px', borderRadius: '14px',
                                background: 'var(--accent-gold)', border: 'none', color: '#000',
                                fontFamily: 'Outfit', fontSize: '1rem', fontWeight: 700,
                                cursor: creating ? 'wait' : 'pointer', alignSelf: 'flex-start',
                                display: 'flex', alignItems: 'center', gap: '10px',
                                transition: 'all 0.2s', opacity: creating ? 0.7 : 1
                            }}
                        >
                            {creating ? <><Loader size={18} className="animate-spin" /> Creazione...</> : <><CheckCircle size={18} /> Conferma Lezione</>}
                        </button>
                    )}
                </div>
            )}

            {/* STEP 4: Risultato */}
            {step === 4 && result && (
                <div className="flex-col gap-4 items-center animate-fade-in" style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: result.success ? 'rgba(0,204,136,0.1)' : 'rgba(255,107,107,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        {result.success
                            ? <CheckCircle size={40} color="#00cc88" />
                            : <Calendar size={40} color="var(--accent-coral)" />
                        }
                    </div>
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.4rem', color: '#fff' }}>
                        {result.success ? 'Lezione Creata!' : 'Errore'}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>{result.message}</p>

                    {result.success && selectedSlot && (
                        <div style={{
                            padding: '16px 24px', borderRadius: '14px',
                            background: 'rgba(0,204,136,0.06)', border: '1px solid rgba(0,204,136,0.15)',
                            marginTop: '8px'
                        }}>
                            <div style={{ fontWeight: 600, color: '#00cc88', fontSize: '0.9rem' }}>
                                {DAYS_IT[selectedSlot.day_of_week]} {new Date(selectedSlot.date + 'T00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                            </div>
                            <div style={{ fontWeight: 700, color: '#fff', fontSize: '1.1rem', marginTop: '4px' }}>
                                {selectedSlot.start_time} – {selectedSlot.end_time}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                                {selectedAthletes.map(a => a.full_name).join(' + ')}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={reset}
                        style={{
                            padding: '12px 24px', borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff', fontFamily: 'Outfit', fontSize: '0.9rem', fontWeight: 600,
                            cursor: 'pointer', marginTop: '12px'
                        }}
                    >
                        Crea un&apos;altra Lezione
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminLessonCreate;
