import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAthleteData } from '../../hooks/useAthleteData';
import { Clock, Play, Dumbbell, Zap, ChevronRight } from 'lucide-react';

const TrainingList = () => {
    const navigate = useNavigate();
    const { isLoading, error, program } = useAthleteData();

    if (isLoading) {
        return (
            <div className="global-container" style={{ paddingTop: '40px', alignItems: 'center', backgroundColor: '#070709', minHeight: '100vh' }}>
                <div className="animate-pulse" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', letterSpacing: '0.1em' }}>
                    Caricamento programma…
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="global-container" style={{ paddingTop: '40px', backgroundColor: '#070709', minHeight: '100vh' }}>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(25,20,20,0.9) 0%, rgba(15,10,10,0.95) 100%)',
                    borderTop: '1px solid rgba(255,100,100,0.2)', borderRadius: '20px', padding: '32px',
                    textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
                }}>
                    <p style={{ color: '#ff6b6b', fontSize: '0.95rem' }}>Errore nel caricamento: {error}</p>
                </div>
            </div>
        );
    }

    if (!program) {
        return (
            <div className="global-container" style={{ paddingTop: '40px', alignItems: 'center', backgroundColor: '#070709', minHeight: '100vh' }}>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(20,20,25,0.8) 0%, rgba(10,10,15,0.95) 100%)',
                    borderTop: '1px solid rgba(255,255,255,0.08)', borderLeft: '1px solid rgba(255,255,255,0.03)',
                    borderRight: '1px solid rgba(0,0,0,0.4)', borderBottom: '2px solid rgba(0,0,0,0.8)',
                    borderRadius: '24px', padding: '48px 32px', textAlign: 'center',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)'
                }}>
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 24px',
                        background: 'linear-gradient(145deg, rgba(40,40,45,1), rgba(20,20,25,1))',
                        boxShadow: 'inset 0 2px 6px rgba(255,255,255,0.04), 0 8px 20px rgba(0,0,0,0.6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <Dumbbell size={32} color="rgba(255,255,255,0.3)" />
                    </div>
                    <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem', color: '#fff', marginBottom: '12px', letterSpacing: '0.02em' }}>
                        Nessun programma attivo
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.9rem', lineHeight: 1.7 }}>
                        Il tuo coach non ha ancora assegnato un programma di allenamento. Contattalo per iniziare!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="global-container stagger-children" style={{
            paddingBottom: '120px',
            backgroundColor: '#070709',
            backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(255, 120, 0, 0.06) 0%, transparent 60%)',
            minHeight: '100vh',
            paddingLeft: '16px', paddingRight: '16px',
            paddingTop: 'env(safe-area-inset-top)'
        }}>
            {/* Section Header */}
            <div className="animate-fade-in" style={{ marginBottom: '28px' }}>
                <p style={{
                    fontSize: '0.72rem', fontFamily: 'Outfit', fontWeight: 600, letterSpacing: '0.18em',
                    textTransform: 'uppercase', color: 'rgba(255,215,170,0.7)', marginBottom: '6px'
                }}>
                    Il Tuo Programma
                </p>
                <h1 style={{
                    fontFamily: 'Outfit', fontWeight: 900, fontSize: '1.8rem', color: '#fff',
                    letterSpacing: '-0.01em', textShadow: '0 2px 12px rgba(0,0,0,0.8)'
                }}>
                    {program.name}
                </h1>
                <div style={{ background: 'linear-gradient(90deg, rgba(255,215,170,0.4), transparent)', height: '1px', width: '50%', marginTop: '12px' }} />
            </div>

            {/* Day Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {program.days.map((day, dayIndex) => (
                    <div key={day.id} className="animate-fade-in" style={{
                        background: 'linear-gradient(135deg, rgba(22, 20, 18, 0.85) 0%, rgba(12, 10, 10, 0.95) 100%)',
                        borderTop: '1px solid rgba(255, 215, 170, 0.12)',
                        borderLeft: '1px solid rgba(255, 215, 170, 0.04)',
                        borderRight: '1px solid rgba(0, 0, 0, 0.5)',
                        borderBottom: '2px solid rgba(0, 0, 0, 0.85)',
                        borderRadius: '22px',
                        overflow: 'hidden',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)'
                    }}>
                        {/* Card Header */}
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '20px 20px 16px 20px',
                            borderBottom: '1px solid rgba(255,255,255,0.04)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {/* Day Number Badge */}
                                <div style={{
                                    width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
                                    background: 'linear-gradient(145deg, rgba(40,36,32,1), rgba(22,18,16,1))',
                                    boxShadow: 'inset 0 1px 3px rgba(255,215,170,0.1), 0 2px 6px rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255,215,170,0.15)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <span style={{ fontFamily: 'Outfit', fontWeight: 900, fontSize: '0.95rem', color: '#FFF5E6' }}>
                                        {dayIndex + 1}
                                    </span>
                                </div>
                                <h3 style={{
                                    fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.05rem',
                                    color: '#fff', letterSpacing: '0.01em'
                                }}>
                                    {day.name}
                                </h3>
                            </div>

                            {/* Start Button */}
                            <button onClick={() => navigate(`/workout/${day.id}`)} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: 'linear-gradient(135deg, rgba(255,215,170,0.15) 0%, rgba(255,195,140,0.05) 100%)',
                                border: '1px solid rgba(255,215,170,0.35)',
                                borderRadius: '12px', padding: '8px 16px',
                                color: '#FFF5E6', fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.82rem',
                                letterSpacing: '0.08em', cursor: 'pointer',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                                transition: 'all 0.2s ease'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,215,170,0.25) 0%, rgba(255,195,140,0.12) 100%)'; e.currentTarget.style.borderColor = 'rgba(255,215,170,0.55)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,215,170,0.15) 0%, rgba(255,195,140,0.05) 100%)'; e.currentTarget.style.borderColor = 'rgba(255,215,170,0.35)'; }}
                            >
                                <Play size={12} /> INIZIA
                            </button>
                        </div>

                        {/* Exercise List */}
                        <div style={{ padding: '8px 0' }}>
                            {day.exercises.length === 0 && (
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', padding: '12px 20px' }}>
                                    Nessun esercizio in questo giorno.
                                </p>
                            )}
                            {day.exercises.map((ex, i) => (
                                <div key={ex.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '10px 20px',
                                    borderBottom: i !== day.exercises.length - 1 ? '1px solid rgba(255,255,255,0.035)' : 'none'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {/* Sets Badge */}
                                        <div style={{
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '8px', padding: '2px 8px', flexShrink: 0,
                                            minWidth: '34px', textAlign: 'center'
                                        }}>
                                            <span style={{
                                                color: '#FFF5E6', fontWeight: 800, fontFamily: 'Outfit',
                                                fontSize: '0.82rem', letterSpacing: '0.02em'
                                            }}>
                                                {ex.sets}×
                                            </span>
                                        </div>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '0.92rem', color: '#fff', marginBottom: '2px' }}>{ex.name}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{ex.reps} ripetizioni</p>
                                        </div>
                                    </div>
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: '4px',
                                        color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: 500
                                    }}>
                                        <Clock size={11} />
                                        <span>{ex.rest}s</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Card Footer Glow */}
                        <div style={{
                            height: '2px',
                            background: 'linear-gradient(90deg, transparent, rgba(255,215,170,0.18), transparent)'
                        }} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrainingList;
