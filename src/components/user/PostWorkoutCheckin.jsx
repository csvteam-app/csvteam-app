import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Flame, Droplets, BatteryCharging, CheckCircle2 } from 'lucide-react';

const PostWorkoutCheckin = ({ workoutName, onSubmit }) => {
    const [difficulty, setDifficulty] = useState(null);
    const [pump, setPump] = useState(null);
    const [energy, setEnergy] = useState(null);

    const isComplete = difficulty && pump && energy;

    const handleSubmit = () => {
        if (!isComplete) return;
        onSubmit({ difficulty, pump, energy });
    };

    const diffOptions = [
        { id: 'Too easy', label: 'Facile', icon: '🥱' },
        { id: 'Just right', label: 'Perfetto', icon: '🔥' },
        { id: 'Too hard', label: 'Estremo', icon: '💀' }
    ];

    const pumpOptions = [
        { id: 'Low', label: 'Basso', icon: '🧊' },
        { id: 'Medium', label: 'Medio', icon: '🎈' },
        { id: 'High', label: 'Alto', icon: '🩸' }
    ];

    const energyOptions = [
        { id: 'Low', label: 'Bassa', icon: '🔋' },
        { id: 'Medium', label: 'Media', icon: '⚡' },
        { id: 'High', label: 'Alta', icon: '🚀' }
    ];

    const ChipSelect = ({ options, value, onChange, themeColor }) => (
        <div className="flex-row gap-2" style={{ width: '100%', display: 'flex' }}>
            {options.map(opt => (
                <button
                    key={opt.id}
                    onClick={() => onChange(opt.id)}
                    style={{
                        flex: 1,
                        background: value === opt.id ? `rgba(${themeColor}, 0.15)` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${value === opt.id ? `rgba(${themeColor}, 0.6)` : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: '16px',
                        padding: '16px 8px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: value === opt.id ? `0 4px 12px rgba(${themeColor}, 0.2)` : 'none',
                    }}
                >
                    <span style={{ fontSize: '1.5rem' }}>{opt.icon}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: value === opt.id ? '#fff' : 'var(--text-secondary)' }}>{opt.label}</span>
                </button>
            ))}
        </div>
    );

    return (
        <div
            className="animate-fade-in"
            style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh',
                background: 'rgba(5,5,8,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '16px'
            }}
        >
            <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                <div className="text-center" style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(212,175,55,0.1)', borderRadius: '50%', marginBottom: '16px' }}>
                        <CheckCircle2 size={32} color="var(--accent-gold)" />
                    </div>
                    <h2 className="text-h1" style={{ color: '#fff', fontSize: '1.8rem' }}>Ottimo Lavoro!</h2>
                    <p className="text-body" style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                        {workoutName || 'Allenamento'} completato.<br />Come è andata?
                    </p>
                </div>

                <div className="flex-col gap-4">
                    <Card glass style={{ padding: '24px' }}>
                        <div className="flex-row gap-2 items-center" style={{ marginBottom: '16px' }}>
                            <Flame size={18} color="var(--accent-warm)" />
                            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>Difficoltà</h3>
                        </div>
                        <ChipSelect options={diffOptions} value={difficulty} onChange={setDifficulty} themeColor="255, 107, 107" />
                    </Card>

                    <Card glass style={{ padding: '24px' }}>
                        <div className="flex-row gap-2 items-center" style={{ marginBottom: '16px' }}>
                            <Droplets size={18} color="var(--accent-teal)" />
                            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>Pump Muscolare</h3>
                        </div>
                        <ChipSelect options={pumpOptions} value={pump} onChange={setPump} themeColor="45, 212, 191" />
                    </Card>

                    <Card glass style={{ padding: '24px' }}>
                        <div className="flex-row gap-2 items-center" style={{ marginBottom: '16px' }}>
                            <BatteryCharging size={18} color="var(--accent-gold)" />
                            <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>Energia Rimanente</h3>
                        </div>
                        <ChipSelect options={energyOptions} value={energy} onChange={setEnergy} themeColor="212, 175, 55" />
                    </Card>
                </div>

                <Button
                    fullWidth
                    size="lg"
                    variant={isComplete ? "primary" : "secondary"}
                    disabled={!isComplete}
                    onClick={handleSubmit}
                    style={{ marginTop: '8px', padding: '20px', borderRadius: '16px', fontSize: '1.1rem', fontWeight: 800 }}
                >
                    SALVA FEEDBACK
                </Button>

            </div>
        </div>
    );
};

export default PostWorkoutCheckin;
