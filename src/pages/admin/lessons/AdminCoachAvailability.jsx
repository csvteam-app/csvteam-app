import { useState, useEffect } from 'react';
import { useAdminLessons } from '../../../hooks/useAdminLessons';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import { Save, Plus, Trash2, Clock, Calendar, AlertCircle } from 'lucide-react';

const DAYS = [
    { value: 0, label: 'Lunedì', short: 'Lun' },
    { value: 1, label: 'Martedì', short: 'Mar' },
    { value: 2, label: 'Mercoledì', short: 'Mer' },
    { value: 3, label: 'Giovedì', short: 'Gio' },
    { value: 4, label: 'Venerdì', short: 'Ven' },
    { value: 5, label: 'Sabato', short: 'Sab' },
    { value: 6, label: 'Domenica', short: 'Dom' },
];

const HOURS = [];
for (let h = 6; h <= 22; h++) {
    HOURS.push(`${h.toString().padStart(2, '0')}:00`);
    HOURS.push(`${h.toString().padStart(2, '0')}:30`);
}

const AdminCoachAvailability = () => {
    const { admin } = useAdminAuth();
    const { coachAvailability, coachOverrides, saveCoachAvailability, saveCoachOverride, deleteCoachOverride, isLoading } = useAdminLessons();
    const coachId = admin?.id;

    // Local state for editing
    const [slots, setSlots] = useState([]); // Array of { day_of_week, start_time, end_time, is_break }
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    // Override form
    const [showOverrideForm, setShowOverrideForm] = useState(false);
    const [overrideDate, setOverrideDate] = useState('');
    const [overrideAvailable, setOverrideAvailable] = useState(false);
    const [overrideStart, setOverrideStart] = useState('09:00');
    const [overrideEnd, setOverrideEnd] = useState('18:00');
    const [overrideReason, setOverrideReason] = useState('');

    // Populate from DB
    useEffect(() => {
        if (coachAvailability && coachId) {
            setSlots(coachAvailability.filter(ca => ca.coach_id === coachId).map(ca => ({
                day_of_week: ca.day_of_week,
                start_time: ca.start_time?.substring(0, 5),
                end_time: ca.end_time?.substring(0, 5),
                is_break: ca.is_break,
                lesson_type_preference: ca.lesson_type_preference || 'both'
            })));
        }
    }, [coachAvailability, coachId]);

    const addSlot = () => {
        setSlots(prev => [...prev, { day_of_week: 0, start_time: '09:00', end_time: '13:00', is_break: false, lesson_type_preference: 'both' }]);
        setDirty(true);
    };

    const removeSlot = (index) => {
        setSlots(prev => prev.filter((_, i) => i !== index));
        setDirty(true);
    };

    const updateSlot = (index, field, value) => {
        setSlots(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
        setDirty(true);
    };

    const handleSave = async () => {
        setSaving(true);
        await saveCoachAvailability(coachId, slots);
        setSaving(false);
        setDirty(false);
    };

    const handleSaveOverride = async () => {
        if (!overrideDate) return;
        await saveCoachOverride(
            coachId,
            overrideDate,
            overrideAvailable,
            overrideAvailable ? overrideStart : null,
            overrideAvailable ? overrideEnd : null,
            overrideReason || null
        );
        setShowOverrideForm(false);
        setOverrideDate('');
        setOverrideReason('');
    };

    const myOverrides = coachOverrides.filter(o => o.coach_id === coachId);

    // Group slots by day for visual overview
    const slotsByDay = DAYS.map(day => ({
        ...day,
        slots: slots
            .map((s, idx) => ({ ...s, _idx: idx }))
            .filter(s => s.day_of_week === day.value && !s.is_break)
            .sort((a, b) => a.start_time.localeCompare(b.start_time)),
        breaks: slots
            .map((s, idx) => ({ ...s, _idx: idx }))
            .filter(s => s.day_of_week === day.value && s.is_break)
    }));

    const inputStyle = {
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        padding: '10px 14px',
        color: '#fff',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '0.9rem',
        outline: 'none'
    };

    if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Caricamento...</div>;

    return (
        <div className="flex-col gap-6">
            {/* Weekly Overview Grid */}
            <div className="glass-card animate-fade-in" style={{ padding: '24px' }}>
                <div className="flex-row justify-between items-center" style={{ marginBottom: '20px' }}>
                    <div>
                        <p className="text-label" style={{ marginBottom: '4px' }}>Disponibilità Settimanale</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Configura le fasce orarie in cui sei disponibile per le lezioni</p>
                    </div>
                    <div className="flex-row gap-2">
                        <button
                            onClick={addSlot}
                            style={{
                                padding: '10px 18px', borderRadius: '12px', cursor: 'pointer',
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff', fontFamily: 'Outfit', fontSize: '0.85rem', fontWeight: 600,
                                display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                            }}
                        >
                            <Plus size={16} /> Aggiungi Fascia
                        </button>
                        {dirty && (
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    padding: '10px 20px', borderRadius: '12px', cursor: saving ? 'wait' : 'pointer',
                                    background: 'var(--accent-gold)', border: 'none',
                                    color: '#000', fontFamily: 'Outfit', fontSize: '0.85rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                                }}
                            >
                                <Save size={16} /> {saving ? 'Salvo...' : 'Salva'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Visual Week Overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                    {slotsByDay.map(day => (
                        <div key={day.value} style={{
                            background: day.slots.length > 0 ? 'rgba(0, 204, 136, 0.06)' : 'rgba(255,255,255,0.02)',
                            border: `1px solid ${day.slots.length > 0 ? 'rgba(0, 204, 136, 0.15)' : 'rgba(255,255,255,0.04)'}`,
                            borderRadius: '12px', padding: '14px', textAlign: 'center'
                        }}>
                            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: day.slots.length > 0 ? '#00cc88' : 'var(--text-muted)', marginBottom: '8px' }}>
                                {day.short}
                            </div>
                            {day.slots.length === 0 ? (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Libero</div>
                            ) : (
                                day.slots.map((s, i) => (
                                    <div key={i} style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 500, lineHeight: 1.6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', paddingBottom: '6px' }}>
                                        <span>{s.start_time}–{s.end_time}</span>
                                        {s.lesson_type_preference === 'single' && <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>Singole</span>}
                                        {s.lesson_type_preference === 'pair' && <span style={{ fontSize: '0.65rem', background: 'rgba(212,175,55,0.2)', color: 'var(--accent-gold)', padding: '2px 6px', borderRadius: '4px' }}>Coppie</span>}
                                    </div>
                                ))
                            )}
                            {day.breaks.length > 0 && day.breaks.map((b, i) => (
                                <div key={`b${i}`} style={{ fontSize: '0.7rem', color: 'var(--accent-coral)', fontWeight: 500, marginTop: '4px' }}>
                                    ☕ {b.start_time}–{b.end_time}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>

                {/* Slot Editor */}
                {slots.length > 0 && (
                    <div className="flex-col gap-3">
                        <p className="text-label" style={{ marginBottom: '4px' }}>Dettaglio Fasce</p>
                        {slots.map((slot, idx) => (
                            <div key={idx} style={{
                                display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center',
                                padding: '14px 18px', borderRadius: '12px',
                                background: slot.is_break ? 'rgba(255, 107, 107, 0.05)' : 'rgba(255,255,255,0.02)',
                                border: `1px solid ${slot.is_break ? 'rgba(255, 107, 107, 0.15)' : 'rgba(255,255,255,0.04)'}`
                            }}>
                                <select
                                    value={slot.day_of_week}
                                    onChange={e => updateSlot(idx, 'day_of_week', parseInt(e.target.value))}
                                    style={{ ...inputStyle, minWidth: '120px' }}
                                >
                                    {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                </select>

                                <div className="flex-row items-center gap-2">
                                    <Clock size={14} color="var(--text-muted)" />
                                    <select value={slot.start_time} onChange={e => updateSlot(idx, 'start_time', e.target.value)} style={{ ...inputStyle, minWidth: '90px' }}>
                                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                                    <select value={slot.end_time} onChange={e => updateSlot(idx, 'end_time', e.target.value)} style={{ ...inputStyle, minWidth: '90px' }}>
                                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>

                                <div className="flex-row items-center gap-2">
                                    <select
                                        value={slot.lesson_type_preference || 'both'}
                                        onChange={e => updateSlot(idx, 'lesson_type_preference', e.target.value)}
                                        style={{ ...inputStyle, minWidth: '95px' }}
                                        disabled={slot.is_break}
                                    >
                                        <option value="both">Tutte</option>
                                        <option value="single">Singole</option>
                                        <option value="pair">Coppie</option>
                                    </select>
                                </div>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem', color: slot.is_break ? 'var(--accent-coral)' : 'var(--text-muted)' }}>
                                    <input type="checkbox" checked={slot.is_break} onChange={e => updateSlot(idx, 'is_break', e.target.checked)} />
                                    Pausa
                                </label>

                                <button onClick={() => removeSlot(idx)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--accent-coral)' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {slots.length === 0 && (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <AlertCircle size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                        <p>Nessuna fascia oraria configurata. Premi &ldquo;Aggiungi Fascia&rdquo; per iniziare.</p>
                    </div>
                )}
            </div>

            {/* Overrides (eccezioni) */}
            <div className="glass-card animate-fade-in" style={{ padding: '24px' }}>
                <div className="flex-row justify-between items-center" style={{ marginBottom: '16px' }}>
                    <div>
                        <p className="text-label" style={{ marginBottom: '4px' }}>Eccezioni Giornaliere</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Giorni liberi, ferie o aperture straordinarie</p>
                    </div>
                    <button
                        onClick={() => setShowOverrideForm(!showOverrideForm)}
                        style={{
                            padding: '10px 18px', borderRadius: '12px', cursor: 'pointer',
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff', fontFamily: 'Outfit', fontSize: '0.85rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <Calendar size={16} /> {showOverrideForm ? 'Annulla' : 'Aggiungi Eccezione'}
                    </button>
                </div>

                {showOverrideForm && (
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end',
                        padding: '18px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)', marginBottom: '16px'
                    }} className="animate-fade-in">
                        <div className="flex-col gap-1">
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Data</label>
                            <input type="date" value={overrideDate} onChange={e => setOverrideDate(e.target.value)} style={inputStyle} />
                        </div>
                        <div className="flex-col gap-1">
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tipo</label>
                            <select value={overrideAvailable.toString()} onChange={e => setOverrideAvailable(e.target.value === 'true')} style={inputStyle}>
                                <option value="false">Giorno OFF</option>
                                <option value="true">Apertura Extra</option>
                            </select>
                        </div>
                        {overrideAvailable && (
                            <>
                                <div className="flex-col gap-1">
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Dalle</label>
                                    <select value={overrideStart} onChange={e => setOverrideStart(e.target.value)} style={inputStyle}>
                                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                                <div className="flex-col gap-1">
                                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Alle</label>
                                    <select value={overrideEnd} onChange={e => setOverrideEnd(e.target.value)} style={inputStyle}>
                                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                        <div className="flex-col gap-1">
                            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Motivo</label>
                            <input type="text" value={overrideReason} onChange={e => setOverrideReason(e.target.value)} placeholder="es. Ferie" style={{ ...inputStyle, minWidth: '120px' }} />
                        </div>
                        <button
                            onClick={handleSaveOverride}
                            style={{
                                padding: '10px 20px', borderRadius: '12px', cursor: 'pointer',
                                background: 'var(--accent-gold)', border: 'none', color: '#000',
                                fontFamily: 'Outfit', fontSize: '0.85rem', fontWeight: 700
                            }}
                        >
                            Salva
                        </button>
                    </div>
                )}

                {myOverrides.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Nessuna eccezione configurata.
                    </div>
                ) : (
                    <div className="flex-col gap-2">
                        {myOverrides.map(ov => (
                            <div key={ov.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '12px 16px', borderRadius: '10px',
                                background: ov.available ? 'rgba(0,204,136,0.06)' : 'rgba(255,107,107,0.06)',
                                border: `1px solid ${ov.available ? 'rgba(0,204,136,0.15)' : 'rgba(255,107,107,0.15)'}`
                            }}>
                                <div className="flex-row items-center gap-3">
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>
                                        {new Date(ov.date + 'T00:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </span>
                                    <span style={{
                                        fontSize: '0.8rem', fontWeight: 600,
                                        color: ov.available ? '#00cc88' : 'var(--accent-coral)',
                                        background: ov.available ? 'rgba(0,204,136,0.1)' : 'rgba(255,107,107,0.1)',
                                        padding: '3px 10px', borderRadius: '8px'
                                    }}>
                                        {ov.available ? `Aperto ${ov.start_time?.substring(0, 5)}–${ov.end_time?.substring(0, 5)}` : 'CHIUSO'}
                                    </span>
                                    {ov.reason && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>— {ov.reason}</span>}
                                </div>
                                <button onClick={() => deleteCoachOverride(ov.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px' }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCoachAvailability;
