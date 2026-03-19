import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Plus, Check, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Badge from '../ui/Badge';

const MUSCLE_GROUPS = [
    { key: 'all', label: 'Tutti' },
    { key: 'chest', label: 'Petto' }, { key: 'back', label: 'Schiena' }, { key: 'shoulders', label: 'Spalle' },
    { key: 'legs', label: 'Gambe' }, { key: 'biceps', label: 'Bicipiti' }, { key: 'triceps', label: 'Tricipiti' },
    { key: 'glutes', label: 'Glutei' }, { key: 'abs', label: 'Addominali' },
];

const mgLabel = (key) => MUSCLE_GROUPS.find(m => m.key === key)?.label || key;

const ExercisePicker = ({ onSelect, onClose }) => {
    const [exercises, setExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterGroup, setFilterGroup] = useState('all');

    useEffect(() => {
        (async () => {
            const { data, error } = await supabase
                .from('exercises')
                .select('id, name, primary_muscle_group, video_url')
                .order('name');
            if (!error) setExercises(data || []);
            setIsLoading(false);
        })();
    }, []);

    const filtered = useMemo(() => {
        return exercises.filter(e => {
            const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
            const matchGroup = filterGroup === 'all' || e.primary_muscle_group === filterGroup;
            return matchSearch && matchGroup;
        });
    }, [exercises, search, filterGroup]);

    return (
        <div
            style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', padding: '20px' }}
            onClick={onClose}
        >
            <div
                className="animate-fade-in flex-col gap-4"
                style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-row justify-between items-center">
                    <h3 className="text-h2">Aggiungi Esercizio</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
                </div>

                {/* Search */}
                <Input placeholder="Cerca esercizio..." value={search} onChange={e => setSearch(e.target.value)} style={{ margin: 0 }} />

                {/* Filter Chips */}
                <div className="flex-row gap-1 hide-scrollbar" style={{ overflowX: 'auto', flexShrink: 0 }}>
                    {MUSCLE_GROUPS.map(mg => (
                        <button
                            key={mg.key}
                            onClick={() => setFilterGroup(mg.key)}
                            style={{
                                padding: '6px 12px', borderRadius: '16px', fontSize: '0.72rem', fontWeight: 600, fontFamily: 'Outfit', whiteSpace: 'nowrap',
                                background: filterGroup === mg.key ? 'var(--gradient-primary)' : 'var(--surface-color-2)',
                                color: filterGroup === mg.key ? '#fff' : 'var(--text-muted)',
                                border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                            }}
                        >
                            {mg.label}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="flex-col hide-scrollbar" style={{ overflowY: 'auto', flex: 1 }}>
                    {isLoading ? (
                        <div style={{ padding: '24px', textAlign: 'center' }}>
                            <Loader size={20} className="animate-pulse" color="var(--text-muted)" />
                        </div>
                    ) : (
                        <>
                            {filtered.map(ex => (
                                <div
                                    key={ex.id}
                                    onClick={() => { onSelect(ex); onClose(); }}
                                    className="flex-row justify-between items-center"
                                    style={{
                                        padding: '12px 14px',
                                        cursor: 'pointer',
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                        transition: 'background 0.1s',
                                        borderRadius: '8px',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-warm-glow)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div>
                                        <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>{ex.name}</p>
                                        <p className="text-small">{mgLabel(ex.primary_muscle_group)}</p>
                                    </div>
                                    <Plus size={18} color="var(--accent-warm)" />
                                </div>
                            ))}
                            {filtered.length === 0 && (
                                <p className="text-small text-center" style={{ padding: '24px' }}>Nessun esercizio trovato</p>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExercisePicker;
