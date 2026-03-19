import { useState } from 'react';
import { useAdminLessons } from '../../../hooks/useAdminLessons';
import { CheckCircle, XCircle, Search, Clock, Calendar, Users, User, AlertCircle } from 'lucide-react';

const DAYS_IT = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

const AdminLessonsRegistro = () => {
    const { lessons, updateLessonStatus, isLoading } = useAdminLessons();
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const filteredLessons = lessons.filter(l => {
        // Search by participant name
        const names = l.lesson_participants?.map(lp => lp.profiles?.full_name?.toLowerCase() || '').join(' ') || '';
        const matchSearch = !search || names.includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || l.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const getStatusBadge = (status) => {
        const styles = {
            scheduled: { bg: 'rgba(212,175,55,0.1)', color: 'var(--accent-gold)', label: 'Prenotata' },
            completed: { bg: 'rgba(0,204,136,0.1)', color: '#00cc88', label: 'Svolta' },
            cancelled: { bg: 'rgba(255,107,107,0.1)', color: 'var(--accent-coral)', label: 'Annullata' },
            no_show: { bg: 'rgba(255,107,107,0.1)', color: 'var(--accent-coral)', label: 'No-Show' },
        };
        const s = styles[status] || { bg: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', label: status };
        return (
            <span style={{
                padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem',
                fontWeight: 600, background: s.bg, color: s.color
            }}>
                {s.label}
            </span>
        );
    };

    const inputStyle = {
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px', padding: '10px 14px', color: '#fff',
        fontFamily: 'Outfit', fontSize: '0.9rem', outline: 'none'
    };

    if (isLoading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Caricamento...</div>;

    return (
        <div className="flex-col gap-6">
            {/* Toolbar */}
            <div className="flex-row gap-4 items-center justify-between" style={{ flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', maxWidth: '300px', flex: 1 }}>
                    <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text" placeholder="Cerca per atleta..."
                        value={search} onChange={e => setSearch(e.target.value)}
                        style={{ ...inputStyle, width: '100%', paddingLeft: '38px' }}
                    />
                </div>
                <div className="flex-row gap-2">
                    {[
                        { key: 'all', label: 'Tutte' },
                        { key: 'scheduled', label: 'Prenotate' },
                        { key: 'completed', label: 'Svolte' },
                        { key: 'cancelled', label: 'Annullate' }
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilterStatus(f.key)}
                            style={{
                                padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
                                background: filterStatus === f.key ? 'rgba(255,255,255,0.08)' : 'transparent',
                                color: filterStatus === f.key ? '#fff' : 'var(--text-muted)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                fontSize: '0.85rem', fontFamily: 'Outfit', transition: 'all 0.2s'
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lessons List (Card-based for mobile) */}
            {filteredLessons.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <AlertCircle size={32} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <p>Nessuna lezione trovata.</p>
                </div>
            ) : (
                <div className="flex-col gap-3">
                    {filteredLessons.map(lesson => {
                        const participants = lesson.lesson_participants || [];
                        const dateObj = new Date(lesson.date + 'T00:00');
                        const dayName = DAYS_IT[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1];

                        return (
                            <div key={lesson.id} className="glass-card animate-fade-in" style={{
                                padding: '18px 22px',
                                borderLeft: `4px solid ${lesson.status === 'scheduled' ? 'var(--accent-gold)' : lesson.status === 'completed' ? '#00cc88' : 'var(--accent-coral)'}`
                            }}>
                                <div className="flex-row justify-between items-start" style={{ flexWrap: 'wrap', gap: '12px' }}>
                                    {/* Left: Info */}
                                    <div className="flex-col gap-2" style={{ flex: 1, minWidth: '200px' }}>
                                        {/* Date/Time */}
                                        <div className="flex-row items-center gap-3">
                                            <Calendar size={14} color="var(--text-muted)" />
                                            <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.95rem' }}>
                                                {dayName} {dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                                            </span>
                                            <Clock size={14} color="var(--text-muted)" />
                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                                {lesson.start_time?.substring(0, 5)} – {lesson.end_time?.substring(0, 5)} ({lesson.duration_minutes}m)
                                            </span>
                                        </div>

                                        {/* Participants */}
                                        <div className="flex-row items-center gap-2">
                                            {lesson.lesson_type === 'pair'
                                                ? <Users size={14} color="var(--accent-gold)" />
                                                : <User size={14} color="var(--text-muted)" />
                                            }
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>
                                                {participants.map(p => p.profiles?.full_name || 'N/A').join(' + ')}
                                            </span>
                                            <span style={{
                                                fontSize: '0.75rem', color: lesson.lesson_type === 'pair' ? 'var(--accent-gold)' : 'var(--text-muted)',
                                                fontWeight: 500
                                            }}>
                                                ({lesson.lesson_type === 'pair' ? 'Coppia' : 'Singola'})
                                            </span>
                                        </div>

                                        {/* Notes */}
                                        {lesson.notes && (
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                {lesson.notes}
                                            </div>
                                        )}
                                    </div>

                                    {/* Right: Status & Actions */}
                                    <div className="flex-col items-end gap-2">
                                        {getStatusBadge(lesson.status)}

                                        {lesson.status === 'scheduled' && (
                                            <div className="flex-row gap-2" style={{ marginTop: '4px' }}>
                                                <button
                                                    onClick={() => updateLessonStatus(lesson.id, 'completed')}
                                                    style={{
                                                        padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                                                        background: 'rgba(0,204,136,0.1)', border: '1px solid rgba(0,204,136,0.2)',
                                                        color: '#00cc88', fontSize: '0.75rem', fontWeight: 600,
                                                        fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '4px'
                                                    }}
                                                >
                                                    <CheckCircle size={12} /> Svolta
                                                </button>
                                                <button
                                                    onClick={() => updateLessonStatus(lesson.id, 'cancelled')}
                                                    style={{
                                                        padding: '6px 12px', borderRadius: '8px', cursor: 'pointer',
                                                        background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)',
                                                        color: 'var(--accent-coral)', fontSize: '0.75rem', fontWeight: 600,
                                                        fontFamily: 'Outfit', display: 'flex', alignItems: 'center', gap: '4px'
                                                    }}
                                                >
                                                    <XCircle size={12} /> Annulla
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminLessonsRegistro;
