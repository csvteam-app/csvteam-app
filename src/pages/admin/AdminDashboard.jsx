import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { supabase } from '../../lib/supabase';
import { useCoachData } from '../../hooks/useCoachData';
import { BookOpen, AlertCircle, Utensils, Save } from 'lucide-react';
import TrafficLightMetric from '../../components/ui/TrafficLightMetric';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { isLoading, error, athletes, updateNutritionTargets } = useCoachData();
    const [expandedClient, setExpandedClient] = useState(null);
    const [editingTargets, setEditingTargets] = useState({});
    const [syncingWc, setSyncingWc] = useState(false);

    const handleSyncWc = async () => {
        setSyncingWc(true);
        try {
            const session = await supabase.auth.getSession();
            const token = session?.data?.session?.access_token;

            const { data, error } = await supabase.functions.invoke('sync-wc-products', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (error) alert('Errore Sincronizzazione: ' + error.message);
            else alert(`Sincronizzazione completata! Trovati ${data?.processed || 0} nuovi prodotti WooCommerce.`);
        } catch (err) {
            alert('Errore Sincronizzazione: ' + err.message);
        } finally {
            setSyncingWc(false);
        }
    };


    const getClientTargets = (clientId) => {
        const client = athletes.find(c => c.id === clientId);
        return client?.nutritionTargets || { kcal: 2000, p: 150, c: 200, f: 60 };
    };

    const handleExpand = (clientId) => {
        if (expandedClient === clientId) {
            setExpandedClient(null);
        } else {
            setExpandedClient(clientId);
            setEditingTargets(getClientTargets(clientId));
        }
    };

    const handleSaveTargets = async (clientId) => {
        const p = parseInt(editingTargets.p) || 0;
        const c = parseInt(editingTargets.c) || 0;
        const f = parseInt(editingTargets.f) || 0;
        const autoKcal = (p * 4) + (c * 4) + (f * 9);
        await updateNutritionTargets(clientId, {
            kcal: autoKcal,
            p,
            c,
            f,
        });
        setExpandedClient(null);
    };

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviting, setInviting] = useState(false);

    const handleInviteAthlete = async () => {
        if (!inviteEmail) return;
        setInviting(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: inviteEmail,
                options: {
                    data: {
                        name: inviteName,
                        full_name: inviteName,
                        role: 'athlete'
                    }
                }
            });
            if (error) throw error;
            alert('Magic Link inviato con successo a ' + inviteEmail);
            setShowInviteModal(false);
            setInviteEmail('');
            setInviteName('');
        } catch (err) {
            alert('Errore invio invito: ' + err.message);
        } finally {
            setInviting(false);
        }
    };

    return (
        <div className="global-container" style={{ margin: '0 auto' }}>

            {/* Header */}
            <div className="flex-row justify-between items-end animate-fade-in" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <p className="text-label" style={{ marginBottom: '8px' }}>Gestione Atleti</p>
                    <h1 className="text-h1" style={{ color: '#fff' }}>Lista Atleti</h1>
                </div>
                <div className="flex-row gap-2 items-center" style={{ width: '100%', maxWidth: '480px', minWidth: '200px' }}>
                    <Input placeholder="Cerca atleta..." style={{ flex: 1 }} />
                    <Button variant="primary" onClick={() => setShowInviteModal(true)} style={{ whiteSpace: 'nowrap', background: 'var(--accent-gold)', color: '#000' }}>
                        + Invita
                    </Button>
                    <Button variant="outline" onClick={handleSyncWc} disabled={syncingWc} style={{ whiteSpace: 'nowrap', borderColor: 'rgba(212,175,55,0.3)', color: 'var(--accent-gold)' }}>
                        {syncingWc ? 'Sincronizzo...' : 'Sync Negozio'}
                    </Button>
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowInviteModal(false)}>
                    <div style={{ background: '#111', padding: '32px', borderRadius: '16px', border: '1px solid #333', maxWidth: '400px', width: '100%' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Invita un nuovo atleta</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Invia un Magic Link per far accedere l&apos;atleta all&apos;app senza password.</p>
                        
                        <label style={{ display: 'block', marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Nome Completo</span>
                            <Input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Mario Rossi" style={{ width: '100%' }} />
                        </label>
                        
                        <label style={{ display: 'block', marginBottom: '24px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Email Atleta</span>
                            <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="mario@email.com" type="email" style={{ width: '100%' }} />
                        </label>

                        <div className="flex-row justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowInviteModal(false)}>Annulla</Button>
                            <Button variant="primary" onClick={handleInviteAthlete} disabled={inviting || !inviteEmail} style={{ background: 'var(--accent-gold)', color: '#000' }}>
                                {inviting ? 'Invio in corso...' : 'Invia Magic Link'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* KPIs — Glass Cards (Real Data) */}
            <div className="flex-row gap-2 animate-fade-in" style={{ flexWrap: 'wrap' }}>
                {[
                    { label: 'Atleti Attivi', value: athletes.length, accent: 'var(--accent-gold)' },
                    { label: 'Conformità Media', value: athletes.length > 0 ? Math.round(athletes.reduce((sum, a) => sum + (a.trafficLights?.composite_score || 0), 0) / athletes.length) + '%' : '—', accent: '#fff' },
                    { label: 'Alert Attivi', value: athletes.reduce((sum, a) => sum + (a.trafficLights?.active_alert_count || 0), 0), accent: '#ff6b6b' },
                ].map((kpi, i) => (
                    <div key={i} style={{
                        flex: '1 1 100px', padding: '16px',
                        background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px',
                        borderLeft: `3px solid ${kpi.accent}`,
                    }}>
                        <p className="text-label" style={{ marginBottom: '6px', fontSize: '0.65rem' }}>{kpi.label}</p>
                        <p style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.3rem', color: '#fff' }}>{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Athletes — Mobile Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {isLoading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>Caricamento atleti...</div>
                ) : error ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#ff6b6b', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>Errore: {error}</div>
                ) : athletes.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>Nessun atleta registrato.</div>
                ) : athletes.map(t => {
                    const isExpanded = expandedClient === t.id;
                    const targets = getClientTargets(t.id);
                    return (
                        <div key={t.id} style={{
                            background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px',
                            overflow: 'hidden', transition: 'border-color 0.2s',
                        }}>
                            {/* Card Header: Avatar + Name + Sub Badge */}
                            <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {t.avatar_url ? (
                                    <img src={t.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                ) : (
                                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', flexShrink: 0 }} />
                                )}
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.full_name}</span>
                                        {t.alert && <AlertCircle size={14} strokeWidth={1.5} color="#ff6b6b" />}
                                    </div>
                                    {/* Subscription inline */}
                                    {t.subscription_status === 'active' ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontWeight: 600, textTransform: 'uppercase' }}>Attivo</span>
                                            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                                                {t.subscription_plan || ''} {t.subscription_expires_at ? `• ${new Date(t.subscription_expires_at).toLocaleDateString('it-IT')}` : ''}
                                            </span>
                                        </div>
                                    ) : t.subscription_status === 'expired' ? (
                                        <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', color: '#f87171', fontWeight: 600, textTransform: 'uppercase', marginTop: '2px', display: 'inline-block' }}>Scaduto</span>
                                    ) : (
                                        <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>Nessun Abbonamento</span>
                                    )}
                                </div>

                                {/* Adherence dot + Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                    {t.trafficLights && <TrafficLightMetric statusToken={t.trafficLights.overall_dot_token} size={12} pulsate={t.trafficLights.overall_status_code === 'red'} />}
                                    <Button variant="ghost" size="icon" title="Nutrizione" onClick={() => handleExpand(t.id)} style={{ padding: '6px' }}>
                                        <Utensils size={16} strokeWidth={1.5} color={isExpanded ? 'var(--accent-gold)' : undefined} />
                                    </Button>
                                    <Button variant="ghost" size="icon" title="Dettaglio" onClick={() => navigate(`/admin/athlete/${t.id}`)} style={{ padding: '6px' }}>
                                        <BookOpen size={16} strokeWidth={1.5} color="rgba(255,245,230,0.7)" />
                                    </Button>
                                </div>
                            </div>

                            {/* Expandable Nutrition Panel */}
                            {isExpanded && (
                                <div style={{ padding: '16px', background: '#141414', borderTop: '1px solid #333' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                                        <Utensils size={14} color="var(--accent-gold)" />
                                        <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.78rem', color: 'var(--accent-gold)', letterSpacing: '0.05em' }}>
                                            OBIETTIVI — {t.full_name}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                                        {[
                                            { key: 'p', label: 'P', unit: 'g', color: 'var(--accent-teal)' },
                                            { key: 'c', label: 'C', unit: 'g', color: 'var(--accent-gold)' },
                                            { key: 'f', label: 'F', unit: 'g', color: 'var(--accent-coral)' },
                                        ].map(macro => (
                                            <div key={macro.key} style={{ flex: '1 1 70px' }}>
                                                <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, color: macro.color, textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'Outfit' }}>
                                                    {macro.label} ({macro.unit})
                                                </label>
                                                <input
                                                    type="number"
                                                    value={editingTargets[macro.key] || ''}
                                                    onChange={e => setEditingTargets(prev => ({ ...prev, [macro.key]: e.target.value }))}
                                                    style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: '#1f1f1f', border: '1px solid #444', color: '#fff', fontSize: '0.95rem', fontWeight: 600, fontFamily: 'Outfit', outline: 'none' }}
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Kcal</span>
                                        <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem', color: 'var(--accent-gold)' }}>
                                            {((parseInt(editingTargets.p) || 0) * 4) + ((parseInt(editingTargets.c) || 0) * 4) + ((parseInt(editingTargets.f) || 0) * 9)}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <Button variant="ghost" size="sm" onClick={() => setExpandedClient(null)}>Annulla</Button>
                                        <Button variant="primary" size="sm" onClick={() => handleSaveTargets(t.id)} style={{ background: 'var(--accent-gold)', color: '#000' }}>
                                            <Save size={14} /> Salva
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminDashboard;
