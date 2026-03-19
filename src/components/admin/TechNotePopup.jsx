import React, { useState } from 'react';
import { X, Zap, Activity, Repeat, Layers, Timer, Hash, Link2, MessageSquare } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';

const PRESETS = [
    { key: 'rpe7', label: 'RPE 7', icon: <Activity size={14} />, noteType: 'rpe', noteText: 'RPE 7' },
    { key: 'rpe8', label: 'RPE 8', icon: <Activity size={14} />, noteType: 'rpe', noteText: 'RPE 8' },
    { key: 'rpe9', label: 'RPE 9', icon: <Activity size={14} />, noteType: 'rpe', noteText: 'RPE 9' },
    { key: 'restpause', label: 'Rest Pause', icon: <Timer size={14} />, noteType: 'rest_pause', noteText: 'Rest Pause' },
    { key: 'superset', label: 'Superset', icon: <Link2 size={14} />, noteType: 'superset', noteText: 'Superset' },
    { key: 'dropset', label: 'Drop Set', icon: <Layers size={14} />, noteType: 'drop_set', noteText: 'Drop Set' },
    { key: 'tempo', label: 'Tempo', icon: <Hash size={14} />, noteType: 'tempo', noteText: 'Tempo 3-1-2-0' },
];

const TechNotePopup = ({ exercise, allExercisesInDay, onSave, onClose }) => {
    const [noteType, setNoteType] = useState(exercise.noteType || null);
    const [noteText, setNoteText] = useState(exercise.noteText || '');
    const [linkedId, setLinkedId] = useState(exercise.linkedSupersetId || null);
    const [customText, setCustomText] = useState('');

    const isSupersetSelected = noteType === 'superset';

    const handlePresetClick = (preset) => {
        setNoteType(preset.noteType);
        setNoteText(preset.noteText);
        if (preset.noteType !== 'superset') setLinkedId(null);
    };

    const handleSave = () => {
        const finalNote = customText.trim() ? `${noteText} — ${customText}` : noteText;
        onSave({
            noteType,
            noteText: finalNote,
            linkedSupersetId: isSupersetSelected ? linkedId : null,
        });
    };

    const handleClear = () => {
        onSave({ noteType: null, noteText: '', linkedSupersetId: null });
    };

    // Exercises available for superset linking (exclude self)
    const linkableExercises = allExercisesInDay.filter(e => e.id !== exercise.id);

    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '20px' }}
            onClick={onClose}
        >
            <div
                className="animate-fade-in flex-col gap-4"
                style={{ background: 'var(--surface-color-1)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 'var(--border-radius-lg)', padding: '24px', width: '100%', maxWidth: '420px' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-row justify-between items-center">
                    <h3 className="text-h2 flex-row gap-2 items-center">
                        <Zap size={18} color="var(--accent-warm)" /> Nota Tecnica
                    </h3>
                    <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
                </div>

                {/* Presets Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '8px' }}>
                    {PRESETS.map(p => (
                        <button
                            key={p.key}
                            onClick={() => handlePresetClick(p)}
                            style={{
                                padding: '10px 8px',
                                borderRadius: '10px',
                                fontSize: '0.78rem',
                                fontWeight: 600,
                                fontFamily: 'Outfit',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                background: noteType === p.noteType && noteText.startsWith(p.noteText) ? 'var(--gradient-primary)' : 'var(--surface-color-2)',
                                color: noteType === p.noteType && noteText.startsWith(p.noteText) ? '#fff' : 'var(--text-secondary)',
                                border: '1px solid ' + (noteType === p.noteType && noteText.startsWith(p.noteText) ? 'transparent' : 'rgba(255,255,255,0.06)'),
                                transition: 'all 0.15s',
                                cursor: 'pointer',
                            }}
                        >
                            {p.icon} {p.label}
                        </button>
                    ))}
                </div>

                {/* Superset Linking */}
                {isSupersetSelected && (
                    <div className="flex-col gap-2 animate-fade-in" style={{ padding: '12px', background: 'var(--surface-color-2)', borderRadius: 'var(--border-radius-sm)' }}>
                        <p className="text-label">Collega con esercizio</p>
                        {linkableExercises.length === 0 ? (
                            <p className="text-small">Nessun altro esercizio nel giorno</p>
                        ) : (
                            linkableExercises.map(le => (
                                <div
                                    key={le.id}
                                    onClick={() => setLinkedId(le.id)}
                                    className="flex-row justify-between items-center"
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        background: linkedId === le.id ? 'var(--accent-warm-glow)' : 'transparent',
                                        border: '1px solid ' + (linkedId === le.id ? 'rgba(240,165,0,0.2)' : 'rgba(255,255,255,0.04)'),
                                        transition: 'all 0.1s',
                                    }}
                                >
                                    <span style={{ fontSize: '0.85rem', fontWeight: linkedId === le.id ? 600 : 400 }}>{le.exerciseName || 'Esercizio'}</span>
                                    {linkedId === le.id && <Link2 size={14} color="var(--accent-warm)" />}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Custom text */}
                <Input
                    label="Note aggiuntive (opzionale)"
                    placeholder="es. Enfatizzare eccentrica"
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                />

                {/* Actions */}
                <div className="flex-row gap-3">
                    {(exercise.noteType) && (
                        <Button variant="ghost" style={{ color: 'var(--accent-coral)' }} onClick={handleClear}>Rimuovi</Button>
                    )}
                    <div style={{ flex: 1 }} />
                    <Button variant="secondary" onClick={onClose}>Annulla</Button>
                    <Button onClick={handleSave}>Salva Nota</Button>
                </div>
            </div>
        </div>
    );
};

export default TechNotePopup;
