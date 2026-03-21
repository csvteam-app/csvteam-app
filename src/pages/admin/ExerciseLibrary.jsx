import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { Plus, Edit3, Trash2, Video, X, Check, Loader, Link2, Upload, Film } from 'lucide-react';

const MUSCLE_GROUPS = [
    { key: 'all', label: 'Tutti' },
    { key: 'chest', label: 'Petto' },
    { key: 'back', label: 'Schiena' },
    { key: 'shoulders', label: 'Spalle' },
    { key: 'legs', label: 'Gambe' },
    { key: 'biceps', label: 'Bicipiti' },
    { key: 'triceps', label: 'Tricipiti' },
    { key: 'glutes', label: 'Glutei' },
    { key: 'abs', label: 'Addominali' },
];

const mgLabel = (key) => MUSCLE_GROUPS.find(m => m.key === key)?.label || key;

const ExerciseLibrary = () => {
    const [exercises, setExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [filterGroup, setFilterGroup] = useState('all');
    const [modal, setModal] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const videoInputRef = useRef(null);

    // ── Fetch exercises from Supabase ──
    const fetchExercises = useCallback(async () => {
        const { data, error } = await supabase
            .from('exercises')
            .select('id, name, primary_muscle_group, video_url, equipment_category, tags')
            .order('name');

        if (error) {
            console.error('[ExerciseLibrary] Fetch error:', error.message);
        } else {
            setExercises(data || []);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => { fetchExercises(); }, [fetchExercises]);

    // ── Filter ──
    const filtered = useMemo(() => {
        return exercises.filter(e => {
            const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
            const matchGroup = filterGroup === 'all' || e.primary_muscle_group === filterGroup;
            return matchSearch && matchGroup;
        });
    }, [exercises, search, filterGroup]);

    // ── Upload video file to Supabase Storage ──
    const handleVideoFile = (e) => {
        const f = e.target.files?.[0];
        if (f) setVideoFile(f);
    };

    const uploadVideoToStorage = async () => {
        if (!videoFile) return null;
        setUploading(true);
        try {
            const ext = videoFile.name.split('.').pop();
            const fileName = `exercise_${Date.now()}.${ext}`;
            const filePath = `tutorials/${fileName}`;

            const { error: uploadErr } = await supabase.storage
                .from('tutorial-videos')
                .upload(filePath, videoFile, { cacheControl: '3600', upsert: false });

            if (uploadErr) {
                console.warn('[VideoUpload] Storage error:', uploadErr.message);
                return `storage:${filePath}`;
            }

            const { data: urlData } = supabase.storage
                .from('tutorial-videos')
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        } catch (err) {
            console.error('[VideoUpload] Error:', err.message);
            alert('Errore upload video: ' + err.message);
            return null;
        } finally {
            setUploading(false);
        }
    };

    // ── Save (Add or Update) ──
    const handleSave = async () => {
        if (!modal) return;
        const { name, primary_muscle_group, tags, video_url } = modal.exercise;
        if (!name.trim()) return;
        setSaving(true);

        // If a video file was selected, upload it first
        let finalVideoUrl = video_url?.trim() || null;
        if (videoFile) {
            const uploadedUrl = await uploadVideoToStorage();
            if (uploadedUrl) finalVideoUrl = uploadedUrl;
        }

        const parsedTags = typeof tags === 'string'
            ? tags.split(',').map(t => t.trim()).filter(Boolean)
            : (tags || []);

        const payload = {
            name: name.trim(),
            primary_muscle_group,
            tags: parsedTags,
            video_url: finalVideoUrl,
        };

        if (modal.mode === 'add') {
            const { error } = await supabase.from('exercises').insert(payload);
            if (error) {
                console.error('[ExerciseLibrary] Insert error:', error.message);
                alert('Errore nel salvataggio: ' + error.message);
            }
        } else {
            const { error } = await supabase.from('exercises').update(payload).eq('id', modal.exercise.id);
            if (error) {
                console.error('[ExerciseLibrary] Update error:', error.message);
                alert('Errore nel salvataggio: ' + error.message);
            }
        }

        setSaving(false);
        setVideoFile(null);
        setModal(null);
        fetchExercises();
    };

    // ── Delete ──
    const handleDelete = async (id) => {
        if (!confirm('Eliminare questo esercizio?')) return;
        const { error } = await supabase.from('exercises').delete().eq('id', id);
        if (error) {
            console.error('[ExerciseLibrary] Delete error:', error.message);
            alert('Impossibile eliminare: esercizio usato in un programma.');
        } else {
            fetchExercises();
        }
    };

    const openAddModal = () => {
        setVideoFile(null);
        setModal({
            mode: 'add',
            exercise: { name: '', primary_muscle_group: 'chest', tags: '', video_url: '' }
        });
    };

    const openEditModal = (ex) => {
        setVideoFile(null);
        setModal({
            mode: 'edit',
            exercise: {
                ...ex,
                primary_muscle_group: ex.primary_muscle_group,
                tags: Array.isArray(ex.tags) ? ex.tags.join(', ') : ex.tags || '',
                video_url: ex.video_url || '',
            }
        });
    };

    if (isLoading) {
        return (
            <div className="flex-col gap-6" style={{ margin: '0 auto', paddingTop: '40px', alignItems: 'center' }}>
                <Loader size={24} className="animate-pulse" color="var(--text-muted)" />
                <p className="text-small">Caricamento esercizi…</p>
            </div>
        );
    }

    return (
        <div className="flex-col gap-4" style={{ margin: '0 auto', width: '100%' }}>
            {/* Header */}
            <div className="animate-fade-in" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <p className="text-label" style={{ marginBottom: '4px' }}>Gestione</p>
                        <h1 className="text-h1" style={{ fontSize: '1.3rem' }}>Libreria Esercizi</h1>
                    </div>
                    <Button onClick={openAddModal} style={{ fontSize: '0.8rem', padding: '10px 16px' }}>
                        <Plus size={16} /> Aggiungi
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="animate-fade-in">
                <Input placeholder="Cerca esercizio..." value={search} onChange={e => setSearch(e.target.value)} style={{ margin: 0 }} />
            </div>

            {/* Muscle Group Filters — Scrollable Pills */}
            <div className="animate-fade-in hide-scrollbar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '4px 0', WebkitOverflowScrolling: 'touch' }}>
                {MUSCLE_GROUPS.map(mg => (
                    <button
                        key={mg.key}
                        onClick={() => setFilterGroup(mg.key)}
                        style={{
                            padding: '7px 14px',
                            borderRadius: '20px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            fontFamily: 'Outfit',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            background: filterGroup === mg.key ? 'var(--gradient-primary)' : 'var(--surface-color-2)',
                            color: filterGroup === mg.key ? '#fff' : 'var(--text-muted)',
                            border: '1px solid ' + (filterGroup === mg.key ? 'transparent' : 'rgba(255,255,255,0.06)'),
                            transition: 'all 0.15s',
                        }}
                    >
                        {mg.label}
                    </button>
                ))}
            </div>

            {/* Count */}
            <p className="text-small animate-fade-in" style={{ margin: 0 }}>{filtered.length} esercizi trovati</p>

            {/* Exercise Cards — Mobile-First */}
            <div className="flex-col gap-2 animate-fade-in">
                {filtered.map(ex => (
                    <div
                        key={ex.id}
                        className="glass-card"
                        style={{
                            padding: '14px 16px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '10px',
                        }}
                    >
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {ex.name}
                            </p>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <Badge variant="warm" style={{ fontSize: '0.65rem' }}>{mgLabel(ex.primary_muscle_group)}</Badge>
                                {ex.video_url ? (
                                    <Badge variant="success" style={{ fontSize: '0.65rem' }}>
                                        <Video size={10} style={{ marginRight: '3px' }} /> Video
                                    </Badge>
                                ) : (
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>No video</span>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <Button variant="ghost" size="icon" onClick={() => openEditModal(ex)} style={{ width: '34px', height: '34px' }}>
                                <Edit3 size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(ex.id)} style={{ width: '34px', height: '34px' }}>
                                <Trash2 size={14} color="var(--accent-coral)" />
                            </Button>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nessun esercizio trovato
                    </div>
                )}
            </div>

            {/* ── Modal ── */}
            {modal && (
                <div
                    style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                    onClick={() => { setModal(null); setVideoFile(null); }}
                >
                    <div
                        className="animate-fade-in"
                        style={{
                            background: 'var(--surface-color-1)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '20px 20px 0 0',
                            padding: '24px 20px',
                            paddingBottom: 'max(24px, env(safe-area-inset-bottom, 20px))',
                            width: '100%',
                            maxWidth: '500px',
                            maxHeight: '85vh',
                            overflowY: 'auto',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 className="text-h2" style={{ fontSize: '1.1rem' }}>{modal.mode === 'add' ? 'Nuovo Esercizio' : 'Modifica Esercizio'}</h2>
                            <Button variant="ghost" size="icon" onClick={() => { setModal(null); setVideoFile(null); }}><X size={20} /></Button>
                        </div>

                        <div className="flex-col gap-3">
                            <Input
                                label="Nome Esercizio"
                                value={modal.exercise.name}
                                onChange={e => setModal({ ...modal, exercise: { ...modal.exercise, name: e.target.value } })}
                                placeholder="es. Panca Piana con Bilanciere"
                            />
                            <div className="flex-col gap-1" style={{ marginBottom: '4px' }}>
                                <label className="text-label">Gruppo Muscolare</label>
                                <select
                                    value={modal.exercise.primary_muscle_group}
                                    onChange={e => setModal({ ...modal, exercise: { ...modal.exercise, primary_muscle_group: e.target.value } })}
                                    style={{
                                        width: '100%', padding: '12px 14px', backgroundColor: 'var(--surface-color-2)',
                                        border: '1.5px solid rgba(255,255,255,0.06)', borderRadius: 'var(--border-radius-sm)',
                                        color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none',
                                    }}
                                >
                                    {MUSCLE_GROUPS.filter(m => m.key !== 'all').map(mg => (
                                        <option key={mg.key} value={mg.key}>{mg.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* VIDEO URL FIELD */}
                            <Input
                                label="Link Video YouTube"
                                value={modal.exercise.video_url}
                                onChange={e => setModal({ ...modal, exercise: { ...modal.exercise, video_url: e.target.value } })}
                                placeholder="https://youtube.com/watch?v=..."
                            />
                            {modal.exercise.video_url && (
                                <a
                                    href={modal.exercise.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--accent-gold)', textDecoration: 'none' }}
                                >
                                    <Link2 size={13} /> Apri video
                                </a>
                            )}

                            {/* DIRECT VIDEO UPLOAD FROM IPHONE */}
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '4px' }}>
                                <label className="text-label" style={{ marginBottom: '8px', display: 'block' }}>Oppure carica da iPhone</label>
                                <input
                                    ref={videoInputRef}
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoFile}
                                    style={{ display: 'none' }}
                                />
                                {videoFile ? (
                                    <div style={{
                                        border: '2px solid var(--accent-teal)',
                                        borderRadius: 'var(--border-radius-sm)',
                                        padding: '12px 14px',
                                        background: 'rgba(45,212,191,0.05)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                            <Film size={18} color="var(--accent-teal)" style={{ flexShrink: 0 }} />
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{videoFile.name}</p>
                                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setVideoFile(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => videoInputRef.current?.click()}
                                        style={{
                                            width: '100%', padding: '14px',
                                            border: '2px dashed rgba(255,255,255,0.1)',
                                            borderRadius: 'var(--border-radius-sm)',
                                            background: 'transparent', cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500,
                                            transition: 'border-color 0.2s',
                                        }}
                                    >
                                        <Upload size={18} /> Tocca per selezionare video
                                    </button>
                                )}
                                {uploading && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: 'var(--accent-gold)', fontSize: '0.78rem' }}>
                                        <Loader size={14} className="animate-pulse" /> Caricamento in corso…
                                    </div>
                                )}
                            </div>

                            <Input
                                label="Tag (separati da virgola)"
                                value={modal.exercise.tags}
                                onChange={e => setModal({ ...modal, exercise: { ...modal.exercise, tags: e.target.value } })}
                                placeholder="es. bilanciere, compound"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <Button variant="secondary" style={{ flex: 1 }} onClick={() => { setModal(null); setVideoFile(null); }}>Annulla</Button>
                            <Button style={{ flex: 1 }} onClick={handleSave} disabled={saving || uploading}>
                                {saving || uploading ? <Loader size={16} className="animate-pulse" /> : <Check size={16} />} Salva
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExerciseLibrary;
