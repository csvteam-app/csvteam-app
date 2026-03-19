import React, { useState, useRef } from 'react';
import { Camera, Video, Upload, CheckCircle, Loader2 } from 'lucide-react';
import Button from '../ui/Button';

const ProofUpload = ({ type = 'photo', stepLabel = '', onUpload, disabled = false }) => {
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef();

    const accept = type === 'video' ? 'video/*' : 'image/*';
    const icon = type === 'video' ? <Video size={18} /> : <Camera size={18} />;

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreview({ url, name: file.name, type: file.type });
    };

    const handleConfirm = () => {
        if (!preview) return;
        setUploading(true);
        // Simulate quick upload (max 3 sec UX)
        setTimeout(() => {
            onUpload({ url: preview.url, name: preview.name, step: stepLabel });
            setUploading(false);
            setPreview(null);
        }, 800);
    };

    if (disabled) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 14px', borderRadius: '12px',
                background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.15)',
            }}>
                <CheckCircle size={16} color="var(--accent-teal)" />
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-teal)', fontWeight: 600 }}>Prova caricata ✓</span>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {stepLabel && (
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {stepLabel}
                </span>
            )}

            {!preview ? (
                <button
                    onClick={() => fileRef.current?.click()}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        padding: '14px', borderRadius: '12px',
                        border: '2px dashed rgba(240,165,0,0.2)',
                        background: 'rgba(240,165,0,0.03)',
                        color: 'var(--accent-warm)',
                        fontWeight: 600, fontSize: '0.85rem',
                        cursor: 'pointer', transition: 'all 0.2s',
                    }}
                >
                    {icon}
                    {type === 'video' ? 'Carica Video' : 'Carica Foto'}
                    <Upload size={14} />
                </button>
            ) : (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px', borderRadius: '12px',
                    background: 'var(--surface-color-2)',
                    border: '1px solid rgba(255,255,255,0.06)',
                }}>
                    {preview.type?.startsWith('image') ? (
                        <img src={preview.url} alt="preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px' }} />
                    ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'var(--surface-color-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Video size={20} color="var(--accent-warm)" />
                        </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {preview.name}
                        </p>
                    </div>
                    <Button size="sm" onClick={handleConfirm} loading={uploading}>
                        {uploading ? <Loader2 size={14} className="animate-spin" /> : '✓'}
                    </Button>
                </div>
            )}

            <input ref={fileRef} type="file" accept={accept} capture="environment" onChange={handleFile} style={{ display: 'none' }} />
        </div>
    );
};

export default ProofUpload;
