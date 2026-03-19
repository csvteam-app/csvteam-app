import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyAvailability } from '../../hooks/useMyAvailability';
import { ArrowLeft, Plus, Trash2, Clock, Calendar, CheckCircle } from 'lucide-react';
import Card from '../../components/ui/Card';

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

const MyAvailability = () => {
    const navigate = useNavigate();
    const { availability, isLoading, saveAvailability } = useMyAvailability();

    const [slots, setSlots] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            setSlots(availability.map(ca => ({
                day_of_week: ca.day_of_week,
                start_time: ca.start_time?.substring(0, 5),
                end_time: ca.end_time?.substring(0, 5),
                prefers_pair: ca.prefers_pair
            })));
        }
    }, [availability, isLoading]);

    const addSlot = () => {
        setSlots(prev => [...prev, { day_of_week: 0, start_time: '18:00', end_time: '20:00', prefers_pair: true }]);
        setDirty(true);
        setSaved(false);
    };

    const removeSlot = (index) => {
        setSlots(prev => prev.filter((_, i) => i !== index));
        setDirty(true);
        setSaved(false);
    };

    const updateSlot = (index, field, value) => {
        setSlots(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
        setDirty(true);
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const success = await saveAvailability(slots);
        setSaving(false);
        if (success) {
            setDirty(false);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
    };

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

    if (isLoading) {
        return (
            <div className="global-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <div style={{ color: 'var(--text-muted)' }}>Caricamento disponibilità...</div>
            </div>
        );
    }

    return (
        <div className="global-container animate-fade-in" style={{ paddingBottom: '100px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', marginTop: '16px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', cursor: 'pointer' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit', color: '#fff', margin: 0 }}>
                        La tua Disponibilità
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                        Indica quando sei disponibile per le lezioni di coaching
                    </p>
                </div>
            </div>

            <Card style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={18} color="var(--accent-gold)" />
                        <span style={{ fontWeight: 600, color: '#fff', fontSize: '1rem' }}>Fasce Orarie</span>
                    </div>
                    <button
                        onClick={addSlot}
                        style={{
                            padding: '8px 14px', borderRadius: '10px', cursor: 'pointer',
                            background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)',
                            color: 'var(--accent-gold)', fontFamily: 'Outfit', fontSize: '0.85rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        <Plus size={16} /> Aggiungi Orario
                    </button>
                </div>

                {slots.length === 0 ? (
                    <div style={{ padding: '30px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                        <Clock size={32} color="rgba(255,255,255,0.2)" style={{ marginBottom: '12px' }} />
                        <p style={{ color: '#fff', fontWeight: 600, marginBottom: '6px' }}>Nessuna disponibilità inserita</p>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aggiungi le fasce orarie in cui puoi allenarti per permettere al coach di fissare le lezioni.</p>
                    </div>
                ) : (
                    <div className="flex-col gap-3">
                        {slots.map((slot, idx) => (
                            <div key={idx} className="animate-fade-in" style={{
                                display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center',
                                padding: '16px', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.04)'
                            }}>
                                <select
                                    value={slot.day_of_week}
                                    onChange={e => updateSlot(idx, 'day_of_week', parseInt(e.target.value))}
                                    style={{ ...inputStyle, minWidth: '130px', flex: '1 1 auto' }}
                                >
                                    {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                                </select>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '2 1 auto' }}>
                                    <Clock size={16} color="var(--text-muted)" />
                                    <select value={slot.start_time} onChange={e => updateSlot(idx, 'start_time', e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                                    <select value={slot.end_time} onChange={e => updateSlot(idx, 'end_time', e.target.value)} style={{ ...inputStyle, flex: 1 }}>
                                        {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                                    </select>
                                </div>

                                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        <div style={{
                                            width: '18px', height: '18px', borderRadius: '4px',
                                            border: `2px solid ${slot.prefers_pair ? 'var(--accent-gold)' : 'rgba(255,255,255,0.2)'}`,
                                            background: slot.prefers_pair ? 'var(--accent-gold)' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                                        }}>
                                            {slot.prefers_pair && <CheckCircle size={14} color="#000" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={slot.prefers_pair}
                                            onChange={e => updateSlot(idx, 'prefers_pair', e.target.checked)}
                                            style={{ display: 'none' }}
                                        />
                                        <span style={{ color: slot.prefers_pair ? '#fff' : 'var(--text-muted)', fontWeight: slot.prefers_pair ? 600 : 400 }}>
                                            Disponibile per lezioni di Coppia
                                        </span>
                                    </label>

                                    <button onClick={() => removeSlot(idx)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', color: 'var(--accent-coral)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                                        <Trash2 size={14} /> Rimuovi
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {dirty && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        style={{
                            width: '100%',
                            padding: '14px', borderRadius: '12px', cursor: saving ? 'wait' : 'pointer',
                            background: 'var(--accent-gold)', border: 'none',
                            color: '#000', fontFamily: 'Outfit', fontSize: '1rem', fontWeight: 700,
                            marginTop: '24px', transition: 'all 0.2s',
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                            opacity: saving ? 0.7 : 1
                        }}
                    >
                        {saving ? 'Salvataggio...' : 'Conferma Orari'}
                    </button>
                )}

                {saved && (
                    <div className="animate-fade-in" style={{
                        marginTop: '24px', padding: '12px', borderRadius: '12px',
                        background: 'rgba(0,204,136,0.1)', border: '1px solid rgba(0,204,136,0.2)',
                        color: '#00cc88', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                    }}>
                        <CheckCircle size={16} /> Disponibilità aggiornata con successo!
                    </div>
                )}
            </Card>

        </div>
    );
};

export default MyAvailability;
