import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useCoachData } from '../../hooks/useCoachData';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import TrafficLightMetric from '../../components/ui/TrafficLightMetric';
import {
    AlertCircle, Save, Utensils, CreditCard, Dumbbell, BookOpen,
    ChevronDown, ChevronUp, UserCheck, UserX, Calendar, Clock,
    Weight, Repeat,
} from 'lucide-react';

// ── constants ──
const PACKAGES = [
    { value: 'trimestrale', label: 'Trimestrale', months: 3 },
    { value: 'semestrale', label: 'Semestrale', months: 6 },
    { value: 'annuale', label: 'Annuale', months: 12 },
];

const MEAL_LABELS = { breakfast: 'Colazione', lunch: 'Pranzo', snack: 'Spuntino', dinner: 'Cena' };

const STATUS_BADGE = {
    pending:  { bg: 'rgba(250,204,21,0.12)', color: '#fbbf24', label: 'In Attesa' },
    approved: { bg: 'rgba(74,222,128,0.12)', color: '#4ade80', label: 'Approvato' },
    rejected: { bg: 'rgba(248,113,113,0.12)', color: '#f87171', label: 'Rifiutato' },
    active:   { bg: 'rgba(74,222,128,0.12)', color: '#4ade80', label: 'Attivo' },
    expired:  { bg: 'rgba(248,113,113,0.12)', color: '#f87171', label: 'Scaduto' },
    cancelled:{ bg: 'rgba(248,113,113,0.12)', color: '#f87171', label: 'Annullato' },
};

const fmtDate = d => d ? new Date(d).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const StatusBadge = ({ status }) => {
    const s = STATUS_BADGE[status] || { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', label: status || 'N/A' };
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: '0.75rem', fontWeight: 600, padding: '4px 10px',
            borderRadius: '8px', background: s.bg, color: s.color,
            textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Outfit', sans-serif",
        }}>
            {s.label}
        </span>
    );
};

// ── Tab pills ──
const TABS = [
    { key: 'abbonamento', label: 'Abbonamento', icon: <CreditCard size={15} /> },
    { key: 'nutrizione', label: 'Nutrizione', icon: <Utensils size={15} /> },
    { key: 'allenamento', label: 'Allenamento', icon: <Dumbbell size={15} /> },
    { key: 'diario', label: 'Diario', icon: <BookOpen size={15} /> },
];

const AdminDashboard = () => {
    const {
        isLoading, error, athletes, programs, pendingUsers,
        updateNutritionTargets, approveUser, rejectUser,
        assignSubscription, revokeSubscription, assignProgram,
    } = useCoachData();

    const [search, setSearch] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [activeTab, setActiveTab] = useState('abbonamento');
    const [editingTargets, setEditingTargets] = useState({});
    const [actionLoading, setActionLoading] = useState(null);
    const [syncingWc, setSyncingWc] = useState(false);

    // Invite modal
    const [showInvite, setShowInvite] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviting, setInviting] = useState(false);

    // Assign subscription form
    const [assignForm, setAssignForm] = useState({
        packageType: 'trimestrale', durationMonths: 3,
        startDate: new Date().toISOString().split('T')[0], notes: '',
    });

    // Assign program
    const [selectedProgramId, setSelectedProgramId] = useState('');

    // Logbook / diary data (loaded per-athlete on tab open)
    const [sessions, setSessions] = useState([]);
    const [expandedSession, setExpandedSession] = useState(null);
    const [sessionSets, setSessionSets] = useState({});
    const [dailyLogs, setDailyLogs] = useState([]);
    const [expandedDay, setExpandedDay] = useState(null);
    const [dayMeals, setDayMeals] = useState({});
    const [logLoading, setLogLoading] = useState(false);

    const filtered = athletes.filter(a => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (a.full_name || '').toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q);
    });

    // ── Expand / Collapse ──
    const handleExpand = (id) => {
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(id);
        setActiveTab('abbonamento');
        const athlete = athletes.find(a => a.id === id);
        setEditingTargets(athlete?.nutritionTargets || { kcal: 2000, p: 150, c: 200, f: 60 });
        setSelectedProgramId(athlete?.assignedProgramId || '');
        // Reset logbook/diary
        setSessions([]); setDailyLogs([]);
        setExpandedSession(null); setExpandedDay(null);
        setSessionSets({}); setDayMeals({});
    };

    // ── Load logbook when allenamento tab opens ──
    useEffect(() => {
        if (!expandedId || activeTab !== 'allenamento') return;
        setLogLoading(true);
        (async () => {
            const { data } = await supabase
                .from('workout_sessions')
                .select('id, started_at, completed_at, program_day_id, program_days(name)')
                .eq('athlete_id', expandedId)
                .not('completed_at', 'is', null)
                .order('completed_at', { ascending: false })
                .limit(20);
            setSessions(data || []);
            setLogLoading(false);
        })();
    }, [expandedId, activeTab]);

    // ── Load diary when diario tab opens ──
    useEffect(() => {
        if (!expandedId || activeTab !== 'diario') return;
        setLogLoading(true);
        (async () => {
            const { data } = await supabase
                .from('daily_logs')
                .select('id, log_date, total_calories, total_protein, total_carbs, total_fat, completion_status')
                .eq('athlete_id', expandedId)
                .order('log_date', { ascending: false })
                .limit(20);
            setDailyLogs(data || []);
            setLogLoading(false);
        })();
    }, [expandedId, activeTab]);

    // Load session sets
    const loadSessionSets = async (sessionId) => {
        if (sessionSets[sessionId]) return;
        const { data } = await supabase
            .from('logbook_sets')
            .select('set_number, weight, reps, rpe, exercises(name)')
            .eq('session_id', sessionId)
            .order('created_at');
        setSessionSets(prev => ({ ...prev, [sessionId]: data || [] }));
    };

    // Load day meals
    const loadDayMeals = async (dailyLogId) => {
        if (dayMeals[dailyLogId]) return;
        const { data } = await supabase
            .from('log_meals')
            .select('id, meal_type, custom_name, log_meal_items(id, custom_food_name, grams, calories, protein, carbs, fat, food_id, food_items(name))')
            .eq('daily_log_id', dailyLogId)
            .order('sort_order');
        setDayMeals(prev => ({ ...prev, [dailyLogId]: data || [] }));
    };

    const groupSetsByExercise = (sets) => {
        if (!sets) return [];
        const groups = {};
        sets.forEach(s => {
            const name = s.exercises?.name || 'Esercizio';
            if (!groups[name]) groups[name] = [];
            groups[name].push(s);
        });
        return Object.entries(groups);
    };

    // ── Actions ──
    const handleAction = async (fn, ...args) => {
        setActionLoading(args[0] || true);
        try { await fn(...args); } catch (err) { alert('Errore: ' + err.message); }
        finally { setActionLoading(null); }
    };

    const handleSaveTargets = async (clientId) => {
        const p = parseInt(editingTargets.p) || 0;
        const c = parseInt(editingTargets.c) || 0;
        const f = parseInt(editingTargets.f) || 0;
        await updateNutritionTargets(clientId, { kcal: (p * 4) + (c * 4) + (f * 9), p, c, f });
    };

    const handleAssignSub = async (userId) => {
        setActionLoading(userId);
        try {
            await assignSubscription(userId, {
                packageType: assignForm.packageType,
                durationMonths: assignForm.durationMonths,
                startDate: assignForm.startDate,
                notes: assignForm.notes,
            });
        } catch (err) { alert('Errore: ' + err.message); }
        finally { setActionLoading(null); }
    };

    const handleAssignProgram = async (athleteId) => {
        if (!selectedProgramId) return;
        setActionLoading(athleteId);
        try { await assignProgram(athleteId, selectedProgramId); }
        catch (err) { alert('Errore: ' + err.message); }
        finally { setActionLoading(null); }
    };

    const handleSyncWc = async () => {
        setSyncingWc(true);
        try {
            const session = await supabase.auth.getSession();
            const token = session?.data?.session?.access_token;
            const { data, error } = await supabase.functions.invoke('sync-wc-products', {
                method: 'POST', headers: { Authorization: `Bearer ${token}` }
            });
            if (error) alert('Errore: ' + error.message);
            else alert(`Sincronizzazione completata! ${data?.processed || 0} nuovi prodotti.`);
        } catch (err) { alert('Errore: ' + err.message); }
        finally { setSyncingWc(false); }
    };

    const handleInvite = async () => {
        if (!inviteEmail) return;
        setInviting(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: inviteEmail,
                options: { data: { name: inviteName, full_name: inviteName, role: 'athlete' } }
            });
            if (error) throw error;
            alert('Magic Link inviato a ' + inviteEmail);
            setShowInvite(false); setInviteEmail(''); setInviteName('');
        } catch (err) { alert('Errore: ' + err.message); }
        finally { setInviting(false); }
    };

    return (
        <div className="global-container" style={{ margin: '0 auto' }}>
            {/* Header */}
            <div className="flex-row justify-between items-end animate-fade-in" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <p className="text-label" style={{ marginBottom: '8px' }}>Gestione Completa</p>
                    <h1 className="text-h1" style={{ color: '#fff' }}>Pannello Atleti</h1>
                </div>
                <div className="flex-row gap-2 items-center" style={{ width: '100%', maxWidth: '480px', minWidth: '200px' }}>
                    <Input placeholder="Cerca atleta..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1 }} />
                    <Button variant="primary" onClick={() => setShowInvite(true)} style={{ whiteSpace: 'nowrap', background: 'var(--accent-gold)', color: '#000' }}>
                        + Invita
                    </Button>
                    <Button variant="outline" onClick={handleSyncWc} disabled={syncingWc} style={{ whiteSpace: 'nowrap', borderColor: 'rgba(212,175,55,0.3)', color: 'var(--accent-gold)' }}>
                        {syncingWc ? 'Sincronizzo...' : 'Sync'}
                    </Button>
                </div>
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setShowInvite(false)}>
                    <div style={{ background: '#111', padding: '32px', borderRadius: '16px', border: '1px solid #333', maxWidth: '400px', width: '100%' }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>Invita un nuovo atleta</h2>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '24px' }}>Invia un Magic Link per accedere all&apos;app.</p>
                        <label style={{ display: 'block', marginBottom: '12px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Nome Completo</span>
                            <Input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Mario Rossi" style={{ width: '100%' }} />
                        </label>
                        <label style={{ display: 'block', marginBottom: '24px' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'block' }}>Email</span>
                            <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="mario@email.com" type="email" style={{ width: '100%' }} />
                        </label>
                        <div className="flex-row justify-end gap-2">
                            <Button variant="ghost" onClick={() => setShowInvite(false)}>Annulla</Button>
                            <Button variant="primary" onClick={handleInvite} disabled={inviting || !inviteEmail} style={{ background: 'var(--accent-gold)', color: '#000' }}>
                                {inviting ? 'Invio...' : 'Invia Magic Link'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* KPIs */}
            <div className="flex-row gap-2 animate-fade-in" style={{ flexWrap: 'wrap' }}>
                {[
                    { label: 'Atleti Attivi', value: athletes.length, accent: 'var(--accent-gold)' },
                    { label: 'In Attesa', value: pendingUsers.length, accent: '#fbbf24' },
                    { label: 'Abb. Attivi', value: athletes.filter(a => a.activeSubscription).length, accent: '#4ade80' },
                    { label: 'Alert', value: athletes.reduce((sum, a) => sum + (a.trafficLights?.active_alert_count || 0), 0), accent: '#ff6b6b' },
                ].map((kpi, i) => (
                    <div key={i} style={{
                        flex: '1 1 70px', padding: '14px',
                        background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px',
                        borderLeft: `3px solid ${kpi.accent}`,
                    }}>
                        <p className="text-label" style={{ marginBottom: '4px', fontSize: '0.72rem' }}>{kpi.label}</p>
                        <p style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Athletes List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {isLoading ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>Caricamento...</div>
                ) : error ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#ff6b6b', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>Errore: {error}</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #333' }}>Nessun atleta trovato.</div>
                ) : filtered.map(t => {
                    const isExpanded = expandedId === t.id;
                    return (
                        <div key={t.id} style={{
                            background: '#1a1a1a', border: `1px solid ${isExpanded ? 'rgba(212,175,55,0.3)' : '#333'}`,
                            borderRadius: '12px', overflow: 'hidden', transition: 'border-color 0.2s',
                        }}>
                            {/* Card Header */}
                            <div
                                onClick={() => handleExpand(t.id)}
                                style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                            >
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
                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap' }}>
                                        <StatusBadge status={t.approval_status} />
                                        {t.activeSubscription && <StatusBadge status="active" />}
                                        {!t.activeSubscription && t.approval_status === 'approved' && (
                                            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>No abb.</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                    {t.trafficLights && <TrafficLightMetric statusToken={t.trafficLights.overall_dot_token} size={12} pulsate={t.trafficLights.overall_status_code === 'red'} />}
                                    {isExpanded ? <ChevronUp size={18} color="rgba(255,255,255,0.4)" /> : <ChevronDown size={18} color="rgba(255,255,255,0.4)" />}
                                </div>
                            </div>

                            {/* ═══ EXPANDED PANEL ═══ */}
                            {isExpanded && (
                                <div style={{ borderTop: '1px solid #333' }}>
                                    {/* Tab Pills */}
                                    <div style={{
                                        display: 'flex', gap: '4px', padding: '10px 12px',
                                        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
                                    }}>
                                        {TABS.map(tab => (
                                            <button
                                                key={tab.key}
                                                onClick={() => setActiveTab(tab.key)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    padding: '10px 16px', borderRadius: '10px', border: 'none',
                                                    fontSize: '0.8rem', fontWeight: 600, fontFamily: "'Outfit'",
                                                    whiteSpace: 'nowrap', cursor: 'pointer', flexShrink: 0,
                                                    minHeight: '44px',
                                                    background: activeTab === tab.key ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)',
                                                    color: activeTab === tab.key ? '#000' : 'var(--text-muted)',
                                                    transition: 'all 0.15s',
                                                }}
                                            >
                                                {tab.icon} {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Tab Content */}
                                    <div style={{ padding: '12px 16px 20px' }}>

                                        {/* ═══ TAB: ABBONAMENTO ═══ */}
                                        {activeTab === 'abbonamento' && (
                                            <div className="flex-col gap-3">
                                                {/* Account status */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                                    <div>
                                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Account</p>
                                                        <StatusBadge status={t.approval_status} />
                                                    </div>
                                                    {t.approval_status === 'pending' && (
                                                        <div style={{ display: 'flex', gap: '6px' }}>
                                                            <Button size="sm" onClick={() => handleAction(approveUser, t.id)} disabled={actionLoading === t.id}
                                                                style={{ background: '#22c55e', color: '#fff', fontSize: '0.72rem' }}>
                                                                <UserCheck size={13} /> Approva
                                                            </Button>
                                                            <Button size="sm" variant="ghost" onClick={() => handleAction(rejectUser, t.id)} disabled={actionLoading === t.id}
                                                                style={{ color: '#f87171', fontSize: '0.72rem' }}>
                                                                <UserX size={13} /> Rifiuta
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Current subscription */}
                                                {t.activeSubscription ? (
                                                    <div style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: '10px', padding: '12px 14px' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#4ade80' }}>Abbonamento Attivo</span>
                                                            <Button size="sm" variant="ghost" onClick={() => handleAction(revokeSubscription, t.activeSubscription.id)}
                                                                disabled={actionLoading === t.activeSubscription.id}
                                                                style={{ color: '#f87171', fontSize: '0.68rem' }}>
                                                                Revoca
                                                            </Button>
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                            <span>Piano: <b style={{ color: '#fff' }}>{t.activeSubscription.package_type}</b></span>
                                                            <span>Scade: <b style={{ color: '#fff' }}>{fmtDate(t.activeSubscription.end_date)}</b></span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px' }}>
                                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '12px' }}>Nessun abbonamento attivo — assegna un piano:</p>
                                                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                                            {PACKAGES.map(pkg => (
                                                                <button key={pkg.value} onClick={() => setAssignForm(f => ({ ...f, packageType: pkg.value, durationMonths: pkg.months }))}
                                                                    style={{
                                                                        padding: '7px 14px', borderRadius: '8px', border: 'none',
                                                                        fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit'",
                                                                        background: assignForm.packageType === pkg.value ? 'var(--accent-gold)' : 'rgba(255,255,255,0.06)',
                                                                        color: assignForm.packageType === pkg.value ? '#000' : 'var(--text-muted)',
                                                                    }}
                                                                >
                                                                    {pkg.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                                            <input type="date" value={assignForm.startDate}
                                                                onChange={e => setAssignForm(f => ({ ...f, startDate: e.target.value }))}
                                                                style={{ padding: '8px', borderRadius: '8px', background: '#222', border: '1px solid #444', color: '#fff', fontSize: '0.82rem', flex: 1 }}
                                                            />
                                                            <Button size="sm" onClick={() => handleAssignSub(t.id)} disabled={actionLoading === t.id}
                                                                style={{ background: 'var(--accent-gold)', color: '#000', whiteSpace: 'nowrap' }}>
                                                                <CreditCard size={13} /> Assegna
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* ═══ TAB: NUTRIZIONE ═══ */}
                                        {activeTab === 'nutrizione' && (
                                            <div className="flex-col gap-3">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                    <Utensils size={14} color="var(--accent-gold)" />
                                                    <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.78rem', color: 'var(--accent-gold)', letterSpacing: '0.05em' }}>
                                                        OBIETTIVI MACRO
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {[
                                                        { key: 'p', label: 'Proteine', unit: 'g', color: 'var(--accent-teal)' },
                                                        { key: 'c', label: 'Carbo', unit: 'g', color: 'var(--accent-gold)' },
                                                        { key: 'f', label: 'Grassi', unit: 'g', color: 'var(--accent-coral)' },
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

                                                <div style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Kcal calcolate</span>
                                                    <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1rem', color: 'var(--accent-gold)' }}>
                                                        {((parseInt(editingTargets.p) || 0) * 4) + ((parseInt(editingTargets.c) || 0) * 4) + ((parseInt(editingTargets.f) || 0) * 9)}
                                                    </span>
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <Button variant="primary" size="sm" onClick={() => handleSaveTargets(t.id)} style={{ background: 'var(--accent-gold)', color: '#000' }}>
                                                        <Save size={14} /> Salva Macro
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* ═══ TAB: ALLENAMENTO ═══ */}
                                        {activeTab === 'allenamento' && (
                                            <div className="flex-col gap-3">
                                                {/* Current program */}
                                                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Programma assegnato</p>
                                                    <p style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff', marginBottom: '10px' }}>
                                                        {t.assignedProgramName || 'Nessun programma'}
                                                    </p>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <select
                                                            value={selectedProgramId}
                                                            onChange={e => setSelectedProgramId(e.target.value)}
                                                            style={{ flex: 1, padding: '8px', borderRadius: '8px', background: '#222', border: '1px solid #444', color: '#fff', fontSize: '0.82rem' }}
                                                        >
                                                            <option value="">Seleziona programma</option>
                                                            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                        </select>
                                                        <Button size="sm" onClick={() => handleAssignProgram(t.id)} disabled={!selectedProgramId || actionLoading === t.id}
                                                            style={{ background: 'var(--accent-gold)', color: '#000', whiteSpace: 'nowrap' }}>
                                                            Assegna
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Logbook */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Dumbbell size={14} color="var(--accent-gold)" />
                                                    <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.78rem', color: 'var(--accent-gold)' }}>LOGBOOK RECENTE</span>
                                                </div>

                                                {logLoading ? (
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '16px' }}>Caricamento...</p>
                                                ) : sessions.length === 0 ? (
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '16px' }}>Nessuna sessione completata.</p>
                                                ) : sessions.map(session => {
                                                    const isOpen = expandedSession === session.id;
                                                    const sets = sessionSets[session.id];
                                                    const grouped = groupSetsByExercise(sets);
                                                    const duration = session.completed_at && session.started_at
                                                        ? Math.round((new Date(session.completed_at) - new Date(session.started_at)) / 60000) : null;

                                                    return (
                                                        <div key={session.id} style={{
                                                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                                            borderRadius: '10px', overflow: 'hidden',
                                                        }}>
                                                            <div onClick={() => { expandedSession === session.id ? setExpandedSession(null) : (setExpandedSession(session.id), loadSessionSets(session.id)); }}
                                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer' }}>
                                                                <div>
                                                                    <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', marginBottom: '2px' }}>{session.program_days?.name || 'Sessione'}</p>
                                                                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                                        <span><Calendar size={11} /> {fmtDate(session.completed_at)}</span>
                                                                        {duration && <span><Clock size={11} /> {duration} min</span>}
                                                                    </div>
                                                                </div>
                                                                {isOpen ? <ChevronUp size={16} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.3)" />}
                                                            </div>
                                                            {isOpen && (
                                                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '10px 14px' }}>
                                                                    {!sets ? <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Caricamento…</p>
                                                                    : grouped.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Nessuna serie.</p>
                                                                    : grouped.map(([exName, exSets]) => (
                                                                        <div key={exName} style={{ marginBottom: '10px' }}>
                                                                            <p style={{ fontWeight: 700, fontSize: '0.78rem', color: 'rgba(255,215,170,0.8)', marginBottom: '6px' }}>{exName}</p>
                                                                            {exSets.map((s, idx) => (
                                                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', marginBottom: '3px', fontSize: '0.82rem' }}>
                                                                                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>SET {s.set_number}</span>
                                                                                    <div style={{ display: 'flex', gap: '12px', color: '#fff', fontWeight: 700 }}>
                                                                                        <span><Weight size={12} color="rgba(255,215,170,0.5)" /> {s.weight}kg</span>
                                                                                        <span><Repeat size={12} color="rgba(255,215,170,0.5)" /> {s.reps}reps</span>
                                                                                        {s.rpe && <span style={{ color: 'rgba(255,215,170,0.5)', fontSize: '0.75rem' }}>RPE {s.rpe}</span>}
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* ═══ TAB: DIARIO ═══ */}
                                        {activeTab === 'diario' && (
                                            <div className="flex-col gap-3">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <BookOpen size={14} color="var(--accent-gold)" />
                                                    <span style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.78rem', color: 'var(--accent-gold)' }}>DIARIO ALIMENTARE</span>
                                                </div>

                                                {logLoading ? (
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '16px' }}>Caricamento...</p>
                                                ) : dailyLogs.length === 0 ? (
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '16px' }}>Nessun giorno registrato.</p>
                                                ) : dailyLogs.map(log => {
                                                    const isOpen = expandedDay === log.id;
                                                    const meals = dayMeals[log.id];
                                                    const dotColor = log.completion_status === 'complete' ? '#22c55e' : log.completion_status === 'partial' ? '#eab308' : 'rgba(255,255,255,0.25)';

                                                    return (
                                                        <div key={log.id} style={{
                                                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                                            borderRadius: '10px', overflow: 'hidden',
                                                        }}>
                                                            <div onClick={() => { expandedDay === log.id ? setExpandedDay(null) : (setExpandedDay(log.id), loadDayMeals(log.id)); }}
                                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, flexShrink: 0, boxShadow: `0 0 4px ${dotColor}` }} />
                                                                    <div>
                                                                        <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', marginBottom: '2px' }}>{fmtDate(log.log_date)}</p>
                                                                        <div style={{ display: 'flex', gap: '8px', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                                                            <span style={{ color: 'rgba(255,215,170,0.7)' }}>{Math.round(log.total_calories)} kcal</span>
                                                                            <span>P:{Math.round(log.total_protein)}g</span>
                                                                            <span>C:{Math.round(log.total_carbs)}g</span>
                                                                            <span>G:{Math.round(log.total_fat)}g</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {isOpen ? <ChevronUp size={16} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={16} color="rgba(255,255,255,0.3)" />}
                                                            </div>
                                                            {isOpen && (
                                                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '10px 14px' }}>
                                                                    {!meals ? <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Caricamento…</p>
                                                                    : meals.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Nessun pasto.</p>
                                                                    : meals.map(meal => {
                                                                        const items = meal.log_meal_items || [];
                                                                        if (items.length === 0) return null;
                                                                        return (
                                                                            <div key={meal.id} style={{ marginBottom: '10px' }}>
                                                                                <p style={{ fontWeight: 700, fontSize: '0.72rem', color: 'rgba(255,215,170,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
                                                                                    {MEAL_LABELS[meal.meal_type] || meal.custom_name || meal.meal_type}
                                                                                </p>
                                                                                {items.map((item, idx) => (
                                                                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', marginBottom: '3px' }}>
                                                                                        <div>
                                                                                            <p style={{ fontSize: '0.82rem', color: '#fff', fontWeight: 500 }}>{item.food_items?.name || item.custom_food_name || 'Alimento'}</p>
                                                                                            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{item.grams}g</p>
                                                                                        </div>
                                                                                        <div style={{ textAlign: 'right' }}>
                                                                                            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,215,170,0.85)' }}>{Math.round(item.calories)} kcal</p>
                                                                                            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>P:{Math.round(item.protein)} C:{Math.round(item.carbs)} G:{Math.round(item.fat)}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
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
