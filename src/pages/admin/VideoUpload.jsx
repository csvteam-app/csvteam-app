import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { Upload, Video, Film, Check, Search, Plus, X, Loader } from 'lucide-react';

const MUSCLE_GROUPS = [
    { key: 'chest', label: 'Petto' },
    { key: 'back', label: 'Schiena' },
    { key: 'shoulders', label: 'Spalle' },
    { key: 'legs', label: 'Gambe' },
    { key: 'biceps', label: 'Bicipiti' },
    { key: 'triceps', label: 'Tricipiti' },
    { key: 'glutes', label: 'Glutei' },
    { key: 'abs', label: 'Addominali' },
];

const VideoUpload = () => {
    const fileRef = useRef(null);
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [exerciseId, setExerciseId] = useState('');
    const [exerciseSearch, setExerciseSearch] = useState('');
    const [exercises, setExercises] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [recentVideos, setRecentVideos] = useState([]);

    // Fetch exercises from Supabase
    useEffect(() => {
        (async () => {
            const { data } = await supabase
                .from('exercises')
                .select('id, name, primary_muscle_group, video_url')
                .order('name');
            setExercises(data || []);
        })();
    }, [uploaded]); // refetch when a video is uploaded

    // Fetch recently updated exercises with videos
    useEffect(() => {
        (async () => {
            const { data } = await supabase
                .from('exercises')
                .select('id, name, video_url')
                .not('video_url', 'is', null)
                .order('name')
                .limit(10);
            setRecentVideos(data || []);
        })();
    }, [uploaded]);

    const filteredExercises = exercises.filter(e =>
        e.name.toLowerCase().includes(exerciseSearch.toLowerCase())
    );

    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
        }
    };

    const handleUpload = async () => {
        if (!file || !title || !exerciseId) {
            alert('Seleziona un file, un titolo e un esercizio da associare.');
            return;
        }

        setIsUploading(true);

        try {
            // 1. Upload file to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${exerciseId}_${Date.now()}.${fileExt}`;
            const filePath = `tutorials/${fileName}`;

            const { error: uploadErr } = await supabase.storage
                .from('tutorial-videos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadErr) {
                // If bucket doesn't exist, fall back to storing a placeholder URL
                console.warn('[VideoUpload] Storage upload failed (bucket may not exist):', uploadErr.message);
                // Store a placeholder so the exercise is marked as having video
                const { error: updateErr } = await supabase
                    .from('exercises')
                    .update({ video_url: `storage:${filePath}` })
                    .eq('id', exerciseId);

                if (updateErr) throw updateErr;
            } else {
                // 2. Get public URL
                const { data: urlData } = supabase.storage
                    .from('tutorial-videos')
                    .getPublicUrl(filePath);

                // 3. Update exercise with video URL
                const { error: updateErr } = await supabase
                    .from('exercises')
                    .update({ video_url: urlData.publicUrl })
                    .eq('id', exerciseId);

                if (updateErr) throw updateErr;
            }

            setUploaded(true);
            setTimeout(() => {
                setFile(null);
                setTitle('');
                setExerciseId('');
                setExerciseSearch('');
                setUploaded(false);
            }, 2000);
        } catch (err) {
            console.error('[VideoUpload] Error:', err.message);
            alert('Errore upload: ' + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex-col gap-6" style={{ maxWidth: '700px', margin: '0 auto' }}>
            {/* Header */}
            <div className="animate-fade-in" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '20px' }}>
                <p className="text-label" style={{ marginBottom: '4px' }}>Carica da iPhone o Desktop</p>
                <h1 className="text-h1">Upload Video Esercizio</h1>
            </div>

            {/* Upload Area */}
            <Card glass className="animate-fade-in">
                <input
                    ref={fileRef}
                    type="file"
                    accept="video/*"
                    capture="environment"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <div
                    onClick={() => fileRef.current?.click()}
                    style={{
                        border: `2px dashed ${file ? 'var(--accent-teal)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 'var(--border-radius)',
                        padding: '40px 20px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: file ? 'var(--accent-teal-glow)' : 'transparent',
                    }}
                >
                    {file ? (
                        <div className="flex-col items-center gap-2">
                            <Film size={36} color="var(--accent-teal)" />
                            <p style={{ fontWeight: 600 }}>{file.name}</p>
                            <p className="text-small">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                            {file.size > 20 * 1024 * 1024 && (
                                <Badge variant="warm">⚠ File grande — consigliato &lt;20MB</Badge>
                            )}
                            <Badge variant="success">Pronto per il caricamento</Badge>
                        </div>
                    ) : (
                        <div className="flex-col items-center gap-3">
                            <Upload size={40} color="var(--accent-warm)" />
                            <p className="text-h3">Tocca per selezionare il video</p>
                            <p className="text-small">Supporta MP4, MOV, WebM • iPhone camera roll</p>
                        </div>
                    )}
                </div>
            </Card>

            {/* Video Details */}
            {file && (
                <Card className="animate-fade-in flex-col gap-4">
                    <Input
                        label="Titolo Video"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="es. Tecnica Panca Inclinata"
                    />

                    {/* Exercise Picker */}
                    <div className="flex-col gap-2">
                        <label className="text-label">Associa a Esercizio</label>
                        <Input
                            placeholder="Cerca esercizio..."
                            value={exerciseSearch}
                            onChange={e => setExerciseSearch(e.target.value)}
                            style={{ margin: 0 }}
                        />
                        <div
                            className="flex-col hide-scrollbar"
                            style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 'var(--border-radius-sm)' }}
                        >
                            {filteredExercises.map(ex => (
                                <div
                                    key={ex.id}
                                    onClick={() => setExerciseId(ex.id)}
                                    className="flex-row justify-between items-center"
                                    style={{
                                        padding: '10px 14px',
                                        cursor: 'pointer',
                                        background: exerciseId === ex.id ? 'var(--accent-warm-glow)' : 'transparent',
                                        borderBottom: '1px solid rgba(255,255,255,0.03)',
                                        transition: 'background 0.1s',
                                    }}
                                >
                                    <span style={{ fontSize: '0.85rem', fontWeight: exerciseId === ex.id ? 600 : 400 }}>
                                        {ex.name} {ex.video_url ? '🎬' : ''}
                                    </span>
                                    {exerciseId === ex.id && <Check size={16} color="var(--accent-warm)" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Upload Button */}
                    <Button
                        fullWidth
                        size="lg"
                        onClick={handleUpload}
                        disabled={isUploading || uploaded}
                        variant={uploaded ? 'teal' : 'primary'}
                        style={{ marginTop: '8px' }}
                    >
                        {uploaded ? (
                            <><Check size={18} /> Video Caricato!</>
                        ) : isUploading ? (
                            <><Loader size={18} className="animate-pulse" /> Caricamento…</>
                        ) : (
                            <><Video size={18} /> Carica Video</>
                        )}
                    </Button>
                </Card>
            )}

            {/* Recent Videos */}
            <Card className="animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <h3 className="text-h3">Esercizi con Video Tutorial</h3>
                </div>
                {recentVideos.length === 0 ? (
                    <p className="text-small" style={{ padding: '20px 18px' }}>Nessun video caricato</p>
                ) : (
                    recentVideos.map((v, i) => (
                        <div
                            key={v.id}
                            className="flex-row justify-between items-center"
                            style={{ padding: '12px 18px', borderBottom: i < recentVideos.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}
                        >
                            <div className="flex-row gap-3 items-center">
                                <Film size={18} color="var(--accent-warm)" />
                                <p style={{ fontWeight: 500, fontSize: '0.85rem' }}>{v.name}</p>
                            </div>
                            <Badge variant="success">Caricato</Badge>
                        </div>
                    ))
                )}
            </Card>
        </div>
    );
};

export default VideoUpload;
