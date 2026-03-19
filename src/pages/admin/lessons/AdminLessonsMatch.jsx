import { useMemo } from 'react';
import { useAdminLessons } from '../../../hooks/useAdminLessons';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import { Users, Calendar, AlertCircle, Star, Percent } from 'lucide-react';

const DAYS_IT = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

const AdminLessonsMatch = () => {
    const { admin } = useAdminAuth();
    const { findCompatiblePairs, isLoading } = useAdminLessons();
    const coachId = admin?.id;

    const pairs = useMemo(() => {
        if (!coachId) return [];
        return findCompatiblePairs(coachId);
    }, [coachId, findCompatiblePairs]);

    if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Analisi compatibilità...</div>;

    return (
        <div className="flex-col gap-6">
            <div className="flex-row justify-between items-center">
                <div>
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.2rem', color: '#fff', margin: 0 }}>
                        Coppie Compatibili
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                        Atleti con disponibilità orarie sovrapposte per lezioni di coppia
                    </p>
                </div>
                <span style={{
                    padding: '6px 14px', borderRadius: '10px', fontSize: '0.85rem',
                    fontWeight: 600, background: 'rgba(212,175,55,0.1)', color: 'var(--accent-gold)',
                    display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                    <Users size={14} /> {pairs.length} Match
                </span>
            </div>

            {pairs.length === 0 ? (
                <div className="glass-card" style={{ padding: '50px 30px', textAlign: 'center' }}>
                    <AlertCircle size={40} color="rgba(255,255,255,0.1)" style={{ marginBottom: '12px' }} />
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 600, color: '#fff', fontSize: '1.1rem' }}>
                        Nessuna coppia compatibile al momento
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
                        Per trovare dei match, assicurati che gli atleti abbiano configurato la loro disponibilità
                        e che abbiano attivato la preferenza &ldquo;Disponibile per coppia&rdquo;.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
                    {pairs.map((pair, idx) => (
                        <div key={idx} className="glass-card animate-fade-in" style={{
                            overflow: 'hidden', position: 'relative',
                            borderTop: '2px solid var(--accent-gold)'
                        }}>
                            {/* Background Glow */}
                            <div style={{
                                position: 'absolute', top: '-40px', right: '-40px',
                                width: '80px', height: '80px', background: 'var(--accent-gold)',
                                filter: 'blur(50px)', opacity: 0.12, pointerEvents: 'none'
                            }} />

                            {/* Compatibility Score */}
                            <div style={{
                                position: 'absolute', top: '16px', right: '16px',
                                display: 'flex', alignItems: 'center', gap: '4px',
                                padding: '4px 10px', borderRadius: '8px',
                                background: 'rgba(212,175,55,0.1)', color: 'var(--accent-gold)',
                                fontSize: '0.8rem', fontWeight: 700
                            }}>
                                <Percent size={12} /> {pair.compatibility}
                            </div>

                            {/* Names */}
                            <div className="flex-row items-center gap-3" style={{ marginBottom: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {pair.athlete1.avatar_url ? (
                                            <img src={pair.athlete1.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-color-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                {pair.athlete1.full_name?.charAt(0)}
                                            </div>
                                        )}
                                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{pair.athlete1.full_name}</span>
                                    </div>
                                </div>

                                <div style={{
                                    width: 30, height: 30, borderRadius: '50%',
                                    background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <Users size={14} color="var(--accent-gold)" />
                                </div>

                                <div style={{ flex: 1, textAlign: 'right' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end' }}>
                                        <span style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{pair.athlete2.full_name}</span>
                                        {pair.athlete2.avatar_url ? (
                                            <img src={pair.athlete2.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-color-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                                                {pair.athlete2.full_name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div style={{
                                display: 'flex', gap: '12px', flexWrap: 'wrap',
                                padding: '14px', borderRadius: '12px',
                                background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.03)'
                            }}>
                                <div className="flex-col items-center" style={{ flex: 1 }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent-gold)' }}>{pair.commonSlotCount}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Slot Comuni</span>
                                </div>
                                <div className="flex-col items-center" style={{ flex: 1 }}>
                                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#00cc88' }}>{pair.commonDays}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Giorni</span>
                                </div>
                            </div>

                            {/* First 5 slots preview */}
                            {pair.slots.length > 0 && (
                                <div style={{ marginTop: '12px' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Calendar size={12} /> Primi slot disponibili
                                    </div>
                                    <div className="flex-row gap-2 flex-wrap">
                                        {pair.slots.slice(0, 5).map((slot, si) => (
                                            <span key={si} style={{
                                                padding: '4px 10px', borderRadius: '8px', fontSize: '0.75rem',
                                                background: si === 0 ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.03)',
                                                color: si === 0 ? 'var(--accent-gold)' : 'var(--text-secondary)',
                                                fontWeight: si === 0 ? 600 : 400,
                                                border: si === 0 ? '1px solid rgba(212,175,55,0.2)' : '1px solid rgba(255,255,255,0.04)',
                                                display: 'flex', alignItems: 'center', gap: '4px'
                                            }}>
                                                {si === 0 && <Star size={10} />}
                                                {DAYS_IT[slot.day_of_week]?.substring(0, 3)} {slot.start_time}
                                            </span>
                                        ))}
                                        {pair.slots.length > 5 && (
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '4px 8px' }}>
                                                +{pair.slots.length - 5} altri
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminLessonsMatch;
