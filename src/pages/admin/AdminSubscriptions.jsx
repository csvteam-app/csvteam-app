import { useState } from 'react';
import { useAdminSubscriptions } from '../../hooks/useAdminSubscriptions';
import Button from '../../components/ui/Button';
import { UserCheck, UserX, CreditCard, Search, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const PACKAGES = [
    { value: 'trimestrale', label: 'Trimestrale', months: 3 },
    { value: 'semestrale', label: 'Semestrale', months: 6 },
    { value: 'annuale', label: 'Annuale', months: 12 },
];

const STATUS_BADGE = {
    pending:   { bg: 'rgba(250,204,21,0.12)', color: '#fbbf24', icon: Clock, label: 'In Attesa' },
    approved:  { bg: 'rgba(74,222,128,0.12)', color: '#4ade80', icon: CheckCircle2, label: 'Approvato' },
    rejected:  { bg: 'rgba(248,113,113,0.12)', color: '#f87171', icon: XCircle, label: 'Rifiutato' },
    active:    { bg: 'rgba(74,222,128,0.12)', color: '#4ade80', icon: CheckCircle2, label: 'Attivo' },
    expired:   { bg: 'rgba(248,113,113,0.12)', color: '#f87171', icon: AlertCircle, label: 'Scaduto' },
    inactive:  { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', icon: Clock, label: 'Inattivo' },
    cancelled: { bg: 'rgba(248,113,113,0.12)', color: '#f87171', icon: XCircle, label: 'Annullato' },
};

const Badge = ({ status }) => {
    const s = STATUS_BADGE[status] || STATUS_BADGE.inactive;
    const Icon = s.icon;
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: '0.68rem', fontWeight: 600, padding: '3px 8px',
            borderRadius: '6px', background: s.bg, color: s.color,
            textTransform: 'uppercase', letterSpacing: '0.05em',
            fontFamily: "'Outfit', sans-serif",
        }}>
            <Icon size={12} /> {s.label}
        </span>
    );
};

const AdminSubscriptions = () => {
    const {
        users, pendingUsers, subscriptions,
        isLoading, error: fetchError,
        approveUser, rejectUser, assignSubscription, revokeSubscription,
    } = useAdminSubscriptions();

    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('pending'); // pending | all | subscriptions
    const [actionError, setActionError] = useState('');
    const [actionLoading, setActionLoading] = useState(null);

    // Assign modal state
    const [assignModal, setAssignModal] = useState(null); // { userId, userName }
    const [assignForm, setAssignForm] = useState({
        packageType: 'trimestrale', durationMonths: 3,
        startDate: new Date().toISOString().split('T')[0], notes: '',
    });

    const filteredUsers = (tab === 'pending' ? pendingUsers : users)
        .filter(u => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (u.full_name || '').toLowerCase().includes(q)
                || (u.email || '').toLowerCase().includes(q);
        });

    const handleAction = async (action, ...args) => {
        setActionLoading(args[0]);
        setActionError('');
        try {
            await action(...args);
        } catch (err) {
            setActionError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleAssign = async () => {
        if (!assignModal) return;
        setActionLoading(assignModal.userId);
        setActionError('');
        try {
            await assignSubscription(assignModal.userId, {
                packageType: assignForm.packageType,
                durationMonths: assignForm.durationMonths,
                startDate: assignForm.startDate,
                notes: assignForm.notes,
            });
            setAssignModal(null);
        } catch (err) {
            setActionError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const getUserSubs = (userId) => subscriptions.filter(s => s.user_id === userId);

    return (
        <div className="global-container" style={{ margin: '0 auto' }}>
            {/* Header */}
            <div className="flex-row justify-between items-end animate-fade-in" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <p className="text-label" style={{ marginBottom: '8px' }}>Gestione Account</p>
                    <h1 className="text-h1" style={{ color: '#fff' }}>Abbonamenti & Approvazioni</h1>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', minWidth: '200px', maxWidth: '400px', flex: 1 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            placeholder="Cerca utente..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 12px 10px 36px',
                                background: '#1a1a1a', border: '1px solid #333', borderRadius: '10px',
                                color: '#fff', fontSize: '0.85rem', outline: 'none',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div className="flex-row gap-2 animate-fade-in" style={{ flexWrap: 'wrap', marginTop: '16px' }}>
                {[
                    { label: 'In Attesa', value: pendingUsers.length, accent: '#fbbf24' },
                    { label: 'Utenti Totali', value: users.length, accent: 'var(--accent-gold)' },
                    { label: 'Abbonamenti Attivi', value: subscriptions.filter(s => s.status === 'active').length, accent: '#4ade80' },
                    { label: 'Scaduti', value: subscriptions.filter(s => s.status === 'expired').length, accent: '#f87171' },
                ].map((kpi, i) => (
                    <div key={i} style={{
                        flex: '1 1 100px', padding: '14px',
                        background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px',
                        borderLeft: `3px solid ${kpi.accent}`,
                    }}>
                        <p className="text-label" style={{ marginBottom: '4px', fontSize: '0.62rem' }}>{kpi.label}</p>
                        <p style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>{kpi.value}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex-row gap-1" style={{ marginTop: '20px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '0' }}>
                {[
                    { id: 'pending', label: `In Attesa (${pendingUsers.length})` },
                    { id: 'all', label: 'Tutti gli Utenti' },
                ].map(t => (
                    <button key={t.id}
                        onClick={() => setTab(t.id)}
                        style={{
                            padding: '10px 18px', background: 'none',
                            border: 'none', borderBottom: tab === t.id ? '2px solid var(--accent-gold)' : '2px solid transparent',
                            color: tab === t.id ? '#fff' : 'var(--text-muted)',
                            fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                            fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                    >{t.label}</button>
                ))}
            </div>

            {/* Error */}
            {(fetchError || actionError) && (
                <p style={{ color: '#f87171', fontSize: '0.82rem', background: 'rgba(248,113,113,0.08)', padding: '10px 14px', borderRadius: '8px', marginTop: '12px' }}>
                    {fetchError || actionError}
                </p>
            )}

            {/* Users Table */}
            <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '12px', marginTop: '16px', overflow: 'hidden' }}>
                <div className="responsive-table">
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                {['Utente', 'Stato Account', 'Abbonamento', 'Scadenza', 'Azioni'].map(h => (
                                    <th key={h} style={{
                                        padding: '14px 14px', fontWeight: 600,
                                        color: 'var(--text-muted)', fontSize: '0.68rem',
                                        textTransform: 'uppercase', letterSpacing: '0.08em',
                                        fontFamily: 'Outfit, sans-serif',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Caricamento...</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Nessun utente trovato.</td></tr>
                            ) : filteredUsers.map(user => {
                                const userSubs = getUserSubs(user.id);
                                const activeSub = userSubs.find(s => s.status === 'active');
                                const isProcessing = actionLoading === user.id;

                                return (
                                    <tr key={user.id} style={{ borderBottom: '1px solid #222', transition: 'background 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#222'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '14px' }}>
                                            <div>
                                                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>{user.full_name || 'N/A'}</span>
                                                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{user.email}</p>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px' }}>
                                            <Badge status={user.approval_status || 'pending'} />
                                        </td>
                                        <td style={{ padding: '14px' }}>
                                            {activeSub ? (
                                                <div>
                                                    <Badge status="active" />
                                                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                                                        {activeSub.package_type} • {activeSub.source === 'manual_admin' ? 'Manuale' : 'Shop'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <Badge status={user.subscription_status || 'inactive'} />
                                            )}
                                        </td>
                                        <td style={{ padding: '14px' }}>
                                            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                {activeSub ? new Date(activeSub.end_date).toLocaleDateString('it-IT') : '—'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px' }}>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {user.approval_status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleAction(approveUser, user.id)}
                                                            disabled={isProcessing}
                                                            style={btnStyle('#4ade80')} title="Approva">
                                                            <UserCheck size={14} /> Approva
                                                        </button>
                                                        <button onClick={() => handleAction(rejectUser, user.id)}
                                                            disabled={isProcessing}
                                                            style={btnStyle('#f87171')} title="Rifiuta">
                                                            <UserX size={14} /> Rifiuta
                                                        </button>
                                                    </>
                                                )}
                                                {user.approval_status === 'approved' && (
                                                    <button onClick={() => {
                                                        setAssignModal({ userId: user.id, userName: user.full_name || user.email });
                                                        setAssignForm({ packageType: 'trimestrale', durationMonths: 3, startDate: new Date().toISOString().split('T')[0], notes: '' });
                                                    }}
                                                        style={btnStyle('var(--accent-gold)')} title="Assegna Piano">
                                                        <CreditCard size={14} /> Assegna Piano
                                                    </button>
                                                )}
                                                {activeSub && (
                                                    <button onClick={() => handleAction(revokeSubscription, activeSub.id)}
                                                        disabled={isProcessing}
                                                        style={btnStyle('#f87171')} title="Revoca">
                                                        <XCircle size={14} /> Revoca
                                                    </button>
                                                )}
                                                {user.approval_status === 'rejected' && (
                                                    <button onClick={() => handleAction(approveUser, user.id)}
                                                        disabled={isProcessing}
                                                        style={btnStyle('#4ade80')} title="Riapprova">
                                                        <UserCheck size={14} /> Riapprova
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assign Modal */}
            {assignModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.8)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: '20px',
                }} onClick={() => setAssignModal(null)}>
                    <div style={{
                        background: '#111', padding: '32px', borderRadius: '16px',
                        border: '1px solid #333', maxWidth: '440px', width: '100%',
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '4px', fontFamily: "'Outfit', sans-serif" }}>
                            Assegna Piano
                        </h2>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
                            Stai assegnando un abbonamento a <strong style={{ color: '#fff' }}>{assignModal.userName}</strong>
                        </p>

                        {/* Package Select */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Tipo Pacchetto</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {PACKAGES.map(p => (
                                    <button key={p.value}
                                        onClick={() => setAssignForm(f => ({ ...f, packageType: p.value, durationMonths: p.months }))}
                                        style={{
                                            flex: 1, padding: '10px 8px', borderRadius: '10px',
                                            background: assignForm.packageType === p.value ? 'rgba(212,175,55,0.12)' : '#1a1a1a',
                                            border: `1px solid ${assignForm.packageType === p.value ? 'rgba(212,175,55,0.4)' : '#333'}`,
                                            color: assignForm.packageType === p.value ? 'var(--accent-gold)' : 'var(--text-muted)',
                                            fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                                            fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s',
                                        }}
                                    >
                                        {p.label}<br />
                                        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{p.months} mesi</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Start Date */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Data Inizio</label>
                            <input
                                type="date"
                                value={assignForm.startDate}
                                onChange={e => setAssignForm(f => ({ ...f, startDate: e.target.value }))}
                                style={inputStyle}
                            />
                        </div>

                        {/* Notes */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>Note (opzionale)</label>
                            <textarea
                                value={assignForm.notes}
                                onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))}
                                placeholder="Assegnato via admin..."
                                rows={2}
                                style={{ ...inputStyle, resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <Button variant="ghost" onClick={() => setAssignModal(null)}>Annulla</Button>
                            <Button onClick={handleAssign} loading={!!actionLoading}
                                style={{ background: 'var(--accent-gold)', color: '#000' }}>
                                Conferma Assegnazione
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/* ── Helper styles ── */
const btnStyle = (color) => ({
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '5px 10px', borderRadius: '8px',
    background: `${color}11`, border: `1px solid ${color}33`,
    color, fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
    fontFamily: "'Outfit', sans-serif", transition: 'all 0.2s',
    whiteSpace: 'nowrap',
});

const labelStyle = {
    display: 'block', fontSize: '0.7rem', fontWeight: 600,
    color: 'var(--text-muted)', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: '6px',
    fontFamily: "'Outfit', sans-serif",
};

const inputStyle = {
    width: '100%', padding: '10px 14px',
    background: '#1f1f1f', border: '1px solid #444',
    borderRadius: '8px', color: '#fff', fontSize: '0.88rem',
    fontFamily: "'Inter', sans-serif", outline: 'none',
};

export default AdminSubscriptions;
