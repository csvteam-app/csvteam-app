import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { useCoachData } from '../../hooks/useCoachData';
import { Eye, BookOpen, AlertCircle, Activity, ChevronDown, ChevronUp, Utensils, Save, Dumbbell, CalendarRange } from 'lucide-react';
import TrafficLightMetric from '../../components/ui/TrafficLightMetric';

const AdminDashboard = () => {
    const { state } = useAppContext();
    const navigate = useNavigate();
    const { isLoading, error, athletes, programs, checkins, assignProgram, updateNutritionTargets } = useCoachData();
    const [expandedClient, setExpandedClient] = useState(null);
    const [editingTargets, setEditingTargets] = useState({});
    const [assigningId, setAssigningId] = useState(null);
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

    const handleProgramAssign = async (athleteId, programId) => {
        if (!programId) return;
        setAssigningId(athleteId);
        await assignProgram(athleteId, programId);
        setAssigningId(null);
    };

    const getLatestCheckin = (userId) => {
        const userCheckins = (checkins || []).filter(c => c.athlete_id === userId);
        if (userCheckins.length === 0) return null;
        return userCheckins[0];
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

            {/* Table — Solid High Contrast */}
            <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', padding: 0, overflow: 'hidden' }}>
                <div className="responsive-table">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                {['Nome Atleta', 'Stato Aderenza', 'Azioni'].map(h => (
                                    <th key={h} style={{
                                        padding: '16px 16px', fontWeight: 600,
                                        color: 'var(--text-muted)', fontSize: '0.72rem',
                                        textTransform: 'uppercase', letterSpacing: '0.08em',
                                        fontFamily: 'Outfit, sans-serif',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Caricamento atleti...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: '#ff6b6b' }}>Errore: {error}</td></tr>
                            ) : athletes.length === 0 ? (
                                <tr><td colSpan={3} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Nessun atleta registrato.</td></tr>
                            ) : athletes.map((t, idx) => {
                                const latestCheckin = getLatestCheckin(t.id);
                                const isExpanded = expandedClient === t.id;
                                const targets = getClientTargets(t.id);
                                return (
                                    <React.Fragment key={t.id}>
                                        <tr
                                            style={{
                                                borderBottom: (!isExpanded && idx !== athletes.length - 1) ? '1px solid #333' : 'none',
                                                transition: 'background 0.25s ease-out',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#222'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <td style={{ padding: '16px 16px' }}>
                                                <div className="flex-row gap-2 items-center">
                                                    {t.avatar_url ? (
                                                        <img src={t.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }} />
                                                    )}
                                                    <div className="flex-row gap-1 items-center">
                                                        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff', whiteSpace: 'nowrap' }}>{t.full_name}</span>
                                                        {t.alert && <AlertCircle size={14} strokeWidth={1.5} color="#ff6b6b" />}
                                                    </div>

                                                    {/* Subscription Badge */}
                                                    <div style={{ marginTop: '4px' }}>
                                                        {t.subscription_status === 'active' ? (
                                                            <div className="flex-row items-center gap-1">
                                                                <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(34,197,94,0.15)', color: '#4ade80', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                                    Attivo
                                                                </span>
                                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                                    {t.subscription_plan || 'N/A'} {t.subscription_expires_at ? `(Scade: ${new Date(t.subscription_expires_at).toLocaleDateString()})` : ''}
                                                                </span>
                                                            </div>
                                                        ) : t.subscription_status === 'expired' ? (
                                                            <div className="flex-row items-center gap-1">
                                                                <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', color: '#f87171', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                                    Scaduto
                                                                </span>
                                                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                                                    {t.subscription_expires_at ? `Scaduto il ${new Date(t.subscription_expires_at).toLocaleDateString()}` : ''}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Nessun Abbonamento</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px 16px' }}>
                                                {t.trafficLights ? (
                                                    <div className="flex-row items-center gap-2" title={t.trafficLights.overall_label}>
                                                        <TrafficLightMetric statusToken={t.trafficLights.overall_dot_token} size={14} pulsate={t.trafficLights.overall_status_code === 'red'} />

                                                        {/* Detailed Mini-Dots */}
                                                        <div className="flex-row items-center gap-1" style={{ paddingLeft: '8px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                                                            <div title={`Dieta: ${t.trafficLights.nutrition_label}`}><TrafficLightMetric statusToken={t.trafficLights.nutrition_dot_token} size={8} /></div>
                                                            <div title={`Training: ${t.trafficLights.training_label}`}><TrafficLightMetric statusToken={t.trafficLights.training_dot_token} size={8} /></div>
                                                            <div title={`Performance: ${t.trafficLights.performance_label}`}><TrafficLightMetric statusToken={t.trafficLights.performance_dot_token} size={8} /></div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Nessun Dato</span>
                                                )}
                                            </td>
                                            <td style={{ padding: '16px 16px' }}>
                                                <div className="flex-row gap-1">
                                                    <Button variant="ghost" size="icon" title="Nutrizione" onClick={() => handleExpand(t.id)}>
                                                        <Utensils size={16} strokeWidth={1.5} color={isExpanded ? 'var(--accent-gold)' : undefined} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost" size="icon" title="Vedi Logbook e Diario"
                                                        onClick={() => navigate(`/admin/athlete/${t.id}`)}
                                                    >
                                                        <BookOpen size={16} strokeWidth={1.5} color="rgba(255,245,230,0.7)" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" title="Vedi Profilo"><Eye size={16} strokeWidth={1.5} /></Button>
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Expandable Nutrition Targets Row */}
                                        {isExpanded && (
                                            <tr>
                                                <td colSpan={4} style={{ padding: 0 }}>
                                                    <div style={{
                                                        padding: '20px 24px',
                                                        background: '#141414',
                                                        borderBottom: idx !== athletes.length - 1 ? '1px solid #333' : 'none',
                                                        borderTop: '1px solid #333',
                                                        animation: 'fadeIn 0.2s ease-out',
                                                    }}>
                                                        <div className="flex-row items-center gap-2" style={{ marginBottom: '16px' }}>
                                                            <Utensils size={16} color="var(--accent-gold)" />
                                                            <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-gold)', letterSpacing: '0.05em' }}>
                                                                OBIETTIVI NUTRIZIONALI — {t.full_name}
                                                            </span>
                                                        </div>

                                                        <div className="flex-row gap-3" style={{ flexWrap: 'wrap', marginBottom: '16px' }}>
                                                            {[
                                                                { key: 'p', label: 'Proteine', unit: 'g', color: 'var(--accent-teal)' },
                                                                { key: 'c', label: 'Carboidrati', unit: 'g', color: 'var(--accent-gold)' },
                                                                { key: 'f', label: 'Grassi', unit: 'g', color: 'var(--accent-coral)' },
                                                            ].map(macro => (
                                                                <div key={macro.key} style={{ flex: '1 1 120px', minWidth: '100px' }}>
                                                                    <label style={{
                                                                        display: 'block', fontSize: '0.7rem', fontWeight: 600,
                                                                        color: macro.color, textTransform: 'uppercase',
                                                                        letterSpacing: '0.08em', marginBottom: '6px', fontFamily: 'Outfit',
                                                                    }}>
                                                                        {macro.label} ({macro.unit})
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        value={editingTargets[macro.key] || ''}
                                                                        onChange={e => setEditingTargets(prev => ({ ...prev, [macro.key]: e.target.value }))}
                                                                        style={{
                                                                            width: '100%', padding: '10px 14px', borderRadius: '8px',
                                                                            background: '#1f1f1f', border: '1px solid #444',
                                                                            color: '#fff', fontSize: '1rem', fontWeight: 600, fontFamily: 'Outfit',
                                                                            outline: 'none', transition: 'border-color 0.2s',
                                                                        }}
                                                                        onFocus={e => e.target.style.borderColor = macro.color}
                                                                        onBlur={e => e.target.style.borderColor = '#444'}
                                                                    />
                                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                                                                        Attuale: {macro.key === 'p' ? targets.protein_g : macro.key === 'c' ? targets.carbs_g : targets.fat_g} {macro.unit}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Auto-calculated Calories Preview */}
                                                        <div style={{
                                                            background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
                                                            borderRadius: '8px', padding: '12px 16px', marginBottom: '16px',
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                        }}>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                                Calorie (auto-calcolate)
                                                            </span>
                                                            <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-gold)' }}>
                                                                {((parseInt(editingTargets.p) || 0) * 4) + ((parseInt(editingTargets.c) || 0) * 4) + ((parseInt(editingTargets.f) || 0) * 9)} kcal
                                                            </span>
                                                        </div>


                                                        {/* Coach Adherence Report (from SQL View) */}
                                                        {t.trafficLights && (
                                                            <div style={{ marginTop: '24px', marginBottom: '24px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <div className="flex-row items-center gap-2" style={{ marginBottom: '16px' }}>
                                                                    <Activity size={16} color="var(--text-main)" />
                                                                    <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.85rem', color: '#fff', letterSpacing: '0.05em' }}>
                                                                        DIAGNOSTICA ADERENZA
                                                                    </span>
                                                                </div>
                                                                <div className="flex-row gap-3" style={{ flexWrap: 'wrap' }}>
                                                                    {/* Nutrition Diagnostic */}
                                                                    <div style={{ flex: '1 1 200px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', borderLeft: `3px solid var(--${t.trafficLights.nutrition_dot_token})` }}>
                                                                        <div className="flex-row justify-between items-center" style={{ marginBottom: '8px' }}>
                                                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Dieta</span>
                                                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{t.trafficLights.nutrition_score}/100</span>
                                                                        </div>
                                                                        <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginBottom: '4px' }}>{t.trafficLights.nutrition_label}</p>
                                                                        <p style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>Azione: {t.trafficLights.nutrition_action}</p>
                                                                    </div>
                                                                    {/* Training Diagnostic */}
                                                                    <div style={{ flex: '1 1 200px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', borderLeft: `3px solid var(--${t.trafficLights.training_dot_token})` }}>
                                                                        <div className="flex-row justify-between items-center" style={{ marginBottom: '8px' }}>
                                                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Allenamento</span>
                                                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{t.trafficLights.training_adherence_pct}%</span>
                                                                        </div>
                                                                        <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginBottom: '4px' }}>{t.trafficLights.training_label}</p>
                                                                        <p style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>Azione: {t.trafficLights.training_action}</p>
                                                                    </div>
                                                                    {/* Performance Diagnostic */}
                                                                    <div style={{ flex: '1 1 200px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', borderLeft: `3px solid var(--${t.trafficLights.performance_dot_token})` }}>
                                                                        <div className="flex-row justify-between items-center" style={{ marginBottom: '8px' }}>
                                                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Performance</span>
                                                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{t.trafficLights.performance_score}/100</span>
                                                                        </div>
                                                                        <p style={{ fontSize: '0.85rem', color: '#fff', fontWeight: 600, marginBottom: '4px' }}>{t.trafficLights.performance_label}</p>
                                                                        <p style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>Azione: {t.trafficLights.performance_action}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex-row gap-2 justify-end">
                                                            <Button variant="ghost" size="sm" onClick={() => setExpandedClient(null)}>
                                                                Annulla
                                                            </Button>
                                                            <Button variant="primary" size="sm" onClick={() => handleSaveTargets(t.id)} style={{ background: 'var(--accent-gold)', color: '#000' }}>
                                                                <Save size={14} /> Salva Obiettivi
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
