import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import { Upload, Video, Film, Check, Search, Plus, X, Loader, Trash2, Edit } from 'lucide-react';

const CATEGORIES = ['Petto', 'Schiena', 'Spalle', 'Gambe', 'Glutei', 'Bicipiti', 'Tricipiti', 'Addominali'];

const AdminAcademy = () => {
    const fileRef = useRef(null);
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploaded, setUploaded] = useState(false);
    const [lessons, setLessons] = useState([]);

    const fetchLessons = async () => {
        const { data } = await supabase.from('lessons').select('*').order('created_at', { ascending: false });
        if (data) setLessons(data);
    };

    useEffect(() => {
        fetchLessons();
    }, [uploaded]);

    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            if (!title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '));
        }
    };

    const handleUpload = async () => {
        if (!file || !title || !category) {
            alert('Seleziona un video, un titolo e una categoria.');
            return;
        }

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `academy_${Date.now()}.${fileExt}`;
            const filePath = `academy/${fileName}`;

            const { error: uploadErr } = await supabase.storage
                .from('tutorial-videos')
                .upload(filePath, file, { cacheControl: '3600', upsert: false });

            let finalUrl = '';
            if (uploadErr) {
                console.warn('[AdminAcademy] Storage upload failed:', uploadErr.message);
                finalUrl = `storage:${filePath}`; // placeholder if bucket fails
            } else {
                const { data: urlData } = supabase.storage.from('tutorial-videos').getPublicUrl(filePath);
                finalUrl = urlData.publicUrl;
            }

            const { error: insertErr } = await supabase.from('lessons').insert([{
                title,
                description,
                category,
                video_url: finalUrl,
                order_index: lessons.length
            }]);

            if (insertErr) throw insertErr;

            setUploaded(true);
            setTimeout(() => {
                setFile(null);
                setTitle('');
                setDescription('');
                setCategory(CATEGORIES[0]);
                setUploaded(false);
            }, 2000);
        } catch (err) {
            console.error('[AdminAcademy] Error:', err.message);
            alert('Errore: ' + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questa lezione?")) return;
        await supabase.from('lessons').delete().eq('id', id);
        fetchLessons();
    };

    return (
        <div className="flex-col gap-6 global-container" style={{ margin: '0 auto', maxWidth: '800px' }}>
            <div className="animate-fade-in" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '20px' }}>
                <p className="text-label" style={{ marginBottom: '4px' }}>Gestione Contenuti CSV</p>
                <h1 className="text-h1">Academy Library</h1>
            </div>

            <Card glass className="animate-fade-in flex-col gap-4">
                <h2 className="text-h3">Aggiungi Nuova Lezione</h2>
                <div className="flex-col gap-4">
                    <Input label="Titolo" value={title} onChange={e => setTitle(e.target.value)} placeholder="Titolo lezione..." />
                    <Input label="Descrizione (Opzionale)" value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descrizione..." />

                    <div className="flex-col gap-2">
                        <label className="text-label">Categoria</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 16px', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff', fontSize: '0.9rem', outline: 'none', appearance: 'none'
                            }}
                        >
                            {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#0F0F1A' }}>{c}</option>)}
                        </select>
                    </div>

                    <div className="flex-col gap-2 mt-2">
                        <label className="text-label">Video File</label>
                        <input ref={fileRef} type="file" accept="video/*" onChange={handleFileChange} style={{ display: 'none' }} />
                        <div
                            onClick={() => fileRef.current?.click()}
                            style={{
                                border: `2px dashed ${file ? 'var(--accent-teal)' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '12px', padding: '24px', textAlign: 'center', cursor: 'pointer',
                                background: file ? 'var(--accent-teal-glow)' : 'transparent',
                            }}
                        >
                            {file ? <p style={{ fontWeight: 600 }}>{file.name}</p> : <p>Tocca per selezionare o trascinare un video qui...</p>}
                        </div>
                    </div>

                    <Button
                        fullWidth size="lg" onClick={handleUpload}
                        disabled={isUploading || uploaded || !file}
                        variant={uploaded ? 'teal' : 'primary'}
                        style={{ marginTop: '12px' }}
                    >
                        {uploaded ? <><Check size={18} /> Pubblicato!</> : isUploading ? <><Loader size={18} className="animate-pulse" /> Caricamento…</> : <><Upload size={18} /> Carica Lezione</>}
                    </Button>
                </div>
            </Card>

            <Card className="animate-fade-in" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <h3 className="text-h3">Lezioni Esistenti</h3>
                </div>
                {lessons.length === 0 ? (
                    <p className="text-small" style={{ padding: '20px 18px' }}>Nessuna lezione pubblicata.</p>
                ) : (
                    <div className="flex-col">
                        {lessons.map((l, i) => (
                            <div key={l.id} className="flex-row justify-between items-center" style={{ padding: '12px 18px', borderBottom: i < lessons.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                                <div className="flex-col gap-1">
                                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{l.title}</p>
                                    <p className="text-small" style={{ color: 'var(--text-muted)' }}>{l.category}</p>
                                </div>
                                <Button size="icon" variant="ghost" onClick={() => handleDelete(l.id)}>
                                    <Trash2 size={16} color="var(--accent-coral)" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AdminAcademy;
