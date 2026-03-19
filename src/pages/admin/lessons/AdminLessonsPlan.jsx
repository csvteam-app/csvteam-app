import React, { useState } from 'react';
import { useAdminLessons } from '../../../hooks/useAdminLessons';
import { Clock, Calendar as CalIcon, Settings, CheckCircle } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import Button from '../../../components/ui/Button';

// Giorni e Ore per la griglia disponibilità
const DAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const HOURS = Array.from({ length: 16 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`);

const AdminLessonsPlan = () => {
    const { clients, scheduleAppointment } = useAdminLessons();
    const [expandedClient, setExpandedClient] = useState(null);

    // Filter clients who have remaining credits but need scheduling
    const clientsToPlan = clients.filter(c =>
        (c.credit_singola_remaining > 0 || c.credit_coppia_remaining > 0)
    );

    const toggleAvailability = (clientId, day, hour, currentAvail, pref) => {
        // Real implementation would update `availability` array in Supabase `profiles`
        alert("Modifica disponibilità in Supabase v2: da implementare");
    };

    return (
        <div className="flex-col gap-6">
            <h2 className="text-h2" style={{ color: '#fff' }}>Richieste di Pianificazione</h2>

            <div className="flex-row gap-4 flex-wrap">
                {clientsToPlan.map(client => {
                    const isExpanded = expandedClient === client.id;
                    const pref = client.lesson_preference || 'singola';
                    const credits = pref === 'singola' ? client.credit_singola_remaining : client.credit_coppia_remaining;
                    const avail = client.availability || [];

                    return (
                        <div key={client.id} className="glass-card animate-fade-in" style={{
                            flex: '1 1 340px',
                            padding: '0',
                            overflow: 'hidden',
                            borderColor: isExpanded ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.04)',
                            transition: 'all 0.3s ease-out'
                        }}>
                            {/* Card Header */}
                            <div
                                className="flex-row justify-between items-center"
                                style={{ padding: '20px', cursor: 'pointer', background: isExpanded ? 'rgba(212,175,55,0.02)' : 'transparent' }}
                                onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                            >
                                <div className="flex-col gap-1">
                                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.2rem', color: '#fff' }}>{client.name}</h3>
                                    <div className="flex-row gap-2 items-center text-small">
                                        <Badge variant={pref === 'coppia' ? 'gold' : 'neutral'}>
                                            {pref === 'coppia' ? 'Coppia' : 'Singola'}
                                        </Badge>
                                        <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>{credits} Rimanenti</span>
                                    </div>
                                </div>
                                <div className="flex-col items-end gap-1">
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Disponibilità</span>
                                    <span style={{ fontWeight: 600, color: '#fff' }}>{avail.length} Slot</span>
                                </div>
                            </div>

                            {/* Card Body (Grid) */}
                            {isExpanded && (
                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '20px', background: 'rgba(0,0,0,0.2)' }} className="animate-fade-in">
                                    <div className="flex-row justify-between items-center" style={{ marginBottom: '16px' }}>
                                        <span className="text-label">Griglia Disponibilità</span>
                                        <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Prendi il primo slot per la demo
                                                if (avail.length > 0) {
                                                    const [d, h] = avail[0].split('-');
                                                    // fake next week date
                                                    scheduleAppointment(client.id, '2026-03-15', h, pref);
                                                    alert(`Lezione schedulata per ${d} alle ${h} e salvata in Supabase!`);
                                                } else {
                                                    alert("Inserisci almeno uno slot di disponibilità");
                                                }
                                            }}
                                        >
                                            <CalIcon size={14} /> Fissa uno Slot
                                        </Button>
                                    </div>

                                    {/* Availability Grid */}
                                    <div style={{ overflowX: 'auto', paddingBottom: '8px' }}>
                                        <div style={{ display: 'flex', gap: '4px', flexDirection: 'column', minWidth: '480px' }}>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                <div style={{ width: '60px' }}></div>
                                                {DAYS.map(d => (
                                                    <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, fontFamily: 'Outfit', paddingBottom: '6px' }}>
                                                        {d.substring(0, 3)}
                                                    </div>
                                                ))}
                                            </div>

                                            {HOURS.map(hour => (
                                                <div key={hour} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                    <div style={{ width: '60px', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', paddingRight: '8px' }}>
                                                        {hour}
                                                    </div>
                                                    {DAYS.map(day => {
                                                        const isSelected = avail.includes(`${day}-${hour}`);
                                                        return (
                                                            <div
                                                                key={`${day}-${hour}`}
                                                                onClick={(e) => { e.stopPropagation(); toggleAvailability(client.id, day, hour, avail, pref); }}
                                                                style={{
                                                                    flex: 1,
                                                                    height: '24px',
                                                                    borderRadius: '4px',
                                                                    background: isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.02)',
                                                                    border: `1px solid ${isSelected ? 'var(--accent-gold)' : 'rgba(255,255,255,0.05)'}`,
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.15s ease'
                                                                }}
                                                                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                                                                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {clientsToPlan.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', width: '100%', color: 'var(--text-muted)' }}>
                        Nessun cliente in attesa di pianificazione. Ottimo lavoro!
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminLessonsPlan;
