import { useState } from 'react';
import { useAdminLessons } from '../../../hooks/useAdminLessons';
import { Package, Plus, Trash2, AlertCircle, User, CheckCircle } from 'lucide-react';

const AdminPackages = () => {
    const { athletes, packages, createPackage, deletePackage, getRemainingCredits, isLoading } = useAdminLessons();

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ athleteId: '', packageType: 'single', totalCredits: 10, notes: '' });
    const [saving, setSaving] = useState(false);
    const [feedback, setFeedback] = useState(null);

    const handleCreate = async () => {
        if (!form.athleteId) return;
        setSaving(true);
        const result = await createPackage({
            athleteId: form.athleteId,
            packageType: form.packageType,
            totalCredits: form.totalCredits,
            notes: form.notes || null
        });
        setSaving(false);
        if (result.error) {
            setFeedback({ type: 'error', msg: result.error });
        } else {
            setFeedback({ type: 'success', msg: 'Pacchetto creato con successo!' });
            setShowForm(false);
            setForm({ athleteId: '', packageType: 'single', totalCredits: 10, notes: '' });
        }
        setTimeout(() => setFeedback(null), 3000);
    };

    const handleDelete = async (pkgId) => {
        if (window.confirm('Eliminare questo pacchetto?')) {
            await deletePackage(pkgId);
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
        outline: 'none',
        width: '100%'
    };

    if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Caricamento pacchetti...</div>;

    // Raggruppa pacchetti per atleta
    const athletePackages = {};
    packages.forEach(pkg => {
        if (!athletePackages[pkg.athlete_id]) athletePackages[pkg.athlete_id] = [];
        athletePackages[pkg.athlete_id].push(pkg);
    });

    return (
        <div className="flex-col gap-6">
            {/* Header */}
            <div className="flex-row justify-between items-center">
                <div>
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.2rem', color: '#fff', margin: 0 }}>
                        Pacchetti & Crediti
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                        Gestisci i crediti lezione per ogni atleta
                    </p>
                </div>
                <button onClick={() => setShowForm(!showForm)} style={{
                    padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
                    background: showForm ? 'rgba(255,100,100,0.1)' : 'rgba(212,175,55,0.1)',
                    border: `1px solid ${showForm ? 'rgba(255,100,100,0.2)' : 'rgba(212,175,55,0.2)'}`,
                    color: showForm ? 'var(--accent-coral)' : 'var(--accent-gold)',
                    fontFamily: 'Outfit', fontSize: '0.85rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                    {showForm ? 'Chiudi' : <><Plus size={16} /> Nuovo Pacchetto</>}
                </button>
            </div>

            {/* Feedback */}
            {feedback && (
                <div className="animate-fade-in" style={{
                    padding: '12px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 600,
                    background: feedback.type === 'success' ? 'rgba(0,204,136,0.1)' : 'rgba(255,100,100,0.1)',
                    border: `1px solid ${feedback.type === 'success' ? 'rgba(0,204,136,0.2)' : 'rgba(255,100,100,0.2)'}`,
                    color: feedback.type === 'success' ? '#00cc88' : '#ff6464',
                    display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                    {feedback.msg}
                </div>
            )}

            {/* Form Nuovo Pacchetto */}
            {showForm && (
                <div className="glass-card animate-fade-in" style={{ padding: '20px' }}>
                    <h4 style={{ fontFamily: 'Outfit', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>Nuovo Pacchetto</h4>
                    <div className="flex-col gap-3">
                        <select value={form.athleteId} onChange={e => setForm(p => ({ ...p, athleteId: e.target.value }))} style={inputStyle}>
                            <option value="">Seleziona Atleta...</option>
                            {athletes.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                        </select>

                        <div className="flex-row gap-3">
                            <select value={form.packageType} onChange={e => setForm(p => ({ ...p, packageType: e.target.value }))} style={{ ...inputStyle, flex: 1 }}>
                                <option value="single">Singola</option>
                                <option value="pair">Coppia</option>
                            </select>
                            <input
                                type="number" min={1} max={100}
                                value={form.totalCredits}
                                onChange={e => setForm(p => ({ ...p, totalCredits: parseInt(e.target.value) || 1 }))}
                                placeholder="N. Crediti"
                                style={{ ...inputStyle, flex: 1 }}
                            />
                        </div>

                        <input
                            value={form.notes}
                            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                            placeholder="Note (opzionale)"
                            style={inputStyle}
                        />

                        <button onClick={handleCreate} disabled={saving || !form.athleteId} style={{
                            padding: '12px', borderRadius: '12px', cursor: saving ? 'wait' : 'pointer',
                            background: 'var(--accent-gold)', border: 'none',
                            color: '#000', fontFamily: 'Outfit', fontSize: '0.95rem', fontWeight: 700,
                            opacity: saving || !form.athleteId ? 0.5 : 1
                        }}>
                            {saving ? 'Creazione...' : 'Crea Pacchetto'}
                        </button>
                    </div>
                </div>
            )}

            {/* Lista Atleti con Crediti */}
            {athletes.length === 0 ? (
                <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
                    <AlertCircle size={32} color="rgba(255,255,255,0.1)" style={{ marginBottom: '12px' }} />
                    <p style={{ color: 'var(--text-muted)' }}>Nessun atleta registrato.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {athletes.map(athlete => {
                        const credits = getRemainingCredits(athlete.id);
                        const athletePkgs = athletePackages[athlete.id] || [];

                        return (
                            <div key={athlete.id} className="glass-card animate-fade-in" style={{ overflow: 'hidden' }}>
                                {/* Athlete Header */}
                                <div className="flex-row items-center gap-3" style={{ marginBottom: '12px' }}>
                                    {athlete.avatar_url ? (
                                        <img src={athlete.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={16} color="var(--accent-gold)" />
                                        </div>
                                    )}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>{athlete.full_name}</div>
                                    </div>
                                </div>

                                {/* Credit Badges */}
                                <div className="flex-row gap-2" style={{ marginBottom: '12px' }}>
                                    <div style={{
                                        flex: 1, padding: '10px', borderRadius: '10px', textAlign: 'center',
                                        background: credits.single > 0 ? 'rgba(0,204,136,0.08)' : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${credits.single > 0 ? 'rgba(0,204,136,0.15)' : 'rgba(255,255,255,0.04)'}`
                                    }}>
                                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: credits.single > 0 ? '#00cc88' : 'var(--text-muted)' }}>{credits.single}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Singola</div>
                                    </div>
                                    <div style={{
                                        flex: 1, padding: '10px', borderRadius: '10px', textAlign: 'center',
                                        background: credits.pair > 0 ? 'rgba(212,175,55,0.08)' : 'rgba(255,255,255,0.02)',
                                        border: `1px solid ${credits.pair > 0 ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.04)'}`
                                    }}>
                                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: credits.pair > 0 ? 'var(--accent-gold)' : 'var(--text-muted)' }}>{credits.pair}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Coppia</div>
                                    </div>
                                </div>

                                {/* Package List */}
                                {athletePkgs.length > 0 && (
                                    <div className="flex-col gap-1">
                                        {athletePkgs.map(pkg => (
                                            <div key={pkg.id} className="flex-row items-center justify-between" style={{
                                                padding: '8px 10px', borderRadius: '8px',
                                                background: 'rgba(0,0,0,0.2)', fontSize: '0.8rem'
                                            }}>
                                                <div className="flex-row items-center gap-2">
                                                    <Package size={12} color="var(--text-muted)" />
                                                    <span style={{ color: '#fff' }}>
                                                        {pkg.used_credits}/{pkg.total_credits} {pkg.package_type === 'single' ? 'sing.' : 'cop.'}
                                                    </span>
                                                    {pkg.notes && <span style={{ color: 'var(--text-muted)' }}>· {pkg.notes}</span>}
                                                </div>
                                                <button onClick={() => handleDelete(pkg.id)} style={{
                                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                                    color: 'var(--accent-coral)', padding: '4px'
                                                }}>
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {athletePkgs.length === 0 && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px' }}>
                                        Nessun pacchetto attivo
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminPackages;
