import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAthleteData } from '../../hooks/useAthleteData';
import { useGamification } from '../../hooks/useGamification';
import FEATURE_FLAGS from '../../config/featureFlags';
import CsvLogo from '../../components/ui/CsvLogo';
import { Gamepad2, PlaySquare, Dumbbell, Zap, Trophy, Flame, CheckCircle2, Circle } from 'lucide-react';

const Dashboard = () => {
    const navigate = useNavigate();
    const { program, nutritionTargets } = useAthleteData();
    const { gamification, dailyTasks: d, LEAGUES } = useGamification();

    const xp = gamification?.xp || 0;
    const streak = gamification?.streak_days || 0;

    const currentLeagueObj = LEAGUES.find(l => l.id === gamification?.current_league) || LEAGUES[0];
    const nextLeague = LEAGUES.find(l => xp < l.threshold) || LEAGUES[LEAGUES.length - 1];
    const xpForNext = nextLeague ? nextLeague.threshold : xp;
    const progressPct = nextLeague ? Math.min((xp / nextLeague.threshold) * 100, 100) : 100;

    // Nutrition goals from Supabase (coach-set targets)
    const nutritionGoals = nutritionTargets
        ? { kcal: nutritionTargets.kcal, p: nutritionTargets.protein_g, c: nutritionTargets.carbs_g, f: nutritionTargets.fat_g }
        : { kcal: 2000, p: 150, c: 200, f: 60 };

    return (
        <div className="global-container" style={{
            height: '100%',
            gap: '0',
            overflow: 'hidden',
            paddingBottom: '0',
        }}>
            {/* ═══ SECTION 1 – LOGO ═══ */}
            <div className="animate-fade-in flex-col items-center" style={{ flex: '0 0 auto', paddingTop: '2vh', paddingBottom: '1vh' }}>
                <div
                    className="csv-logo-coin-3d"
                    style={{ width: '130px', cursor: 'pointer' }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <CsvLogo size="100%" showText={false} />
                </div>
            </div>

            {/* ═══ Main Content Container ═══ */}
            <div className="animate-fade-in w-full" style={{ maxWidth: '1200px', margin: '0 auto', marginTop: 'auto', flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '16px', transform: 'translateY(-4px)' }}>
                <div className="responsive-grid-2col">
                    {/* ═══ LEFT COLUMN (Status & Progress) ═══ */}
                    <div className="flex-col gap-4">
                        {/* ═══ SECTION 2 – USER PROGRESS CARD (solo se XP attivo) ═══ */}
                        {FEATURE_FLAGS.XP && (
                            <div className="glass-card flex-col gap-3" style={{ padding: '24px', borderColor: 'rgba(212,175,55,0.4)', boxShadow: '0 0 30px rgba(212,175,55,0.1)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p className="dopamine-text-glow" style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent-gold)', fontWeight: 700 }}>
                                            Il Tuo Livello
                                        </p>
                                        <h2 className="dopamine-text-glow" style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', marginTop: '4px' }}>
                                            <Trophy size={18} color="var(--accent-gold)" strokeWidth={2.5} className="drop-shadow-gold" />
                                            Lega {currentLeagueObj ? currentLeagueObj.name : 'Bronzo'}
                                        </h2>
                                    </div>
                                    {currentLeagueObj && (
                                        <span className="drop-shadow-gold" style={{ fontSize: '2.5rem', filter: 'drop-shadow(0 0 15px rgba(212,175,55,0.5))' }}>{currentLeagueObj.icon}</span>
                                    )}
                                </div>

                                {/* Progress Bar & Streak */}
                                <div style={{ marginTop: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>{xp.toLocaleString()} XP</span>
                                        <span>{xpForNext.toLocaleString()} XP</span>
                                    </div>
                                    <div className="progress-bar-premium">
                                        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                                    </div>

                                    {FEATURE_FLAGS.STREAK && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)', padding: '6px 12px', borderRadius: '16px' }}>
                                                <Flame size={14} color="#ff6b6b" />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ff6b6b' }}>Streak: {streak} Giorni</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Zap size={14} color="var(--accent-gold)" />
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mancano {Math.max(xpForNext - xp, 0)} XP</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ═══ SECTION 5 – DAILY PROGRESS (solo se DAILY_TASKS attivo) ═══ */}
                        {FEATURE_FLAGS.DAILY_TASKS && (
                            <div className="glass-card" style={{
                                padding: '24px',
                                borderColor: d.claimed ? 'rgba(212,175,55,0.4)' : 'var(--glass-border)',
                                boxShadow: d.claimed ? '0 8px 32px rgba(212,175,55,0.1)' : 'var(--glass-shadow)',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>I Tuoi Progressi Quotidiani</h3>
                                    {d.claimed && (
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)', background: 'rgba(212,175,55,0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                                            +20 XP Bonus
                                        </span>
                                    )}
                                </div>

                                {/* Progress Visualizer */}
                                <div style={{ marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                                        <span>Progresso</span>
                                        <span style={{ fontWeight: 700, color: '#fff' }}>
                                            {[d.steps, d.workout, d.photo].filter(Boolean).length} / 3 task completate
                                        </span>
                                    </div>
                                    <div className="progress-bar-premium" style={{ height: '6px' }}>
                                        <div className="progress-fill" style={{ width: `${([d.steps, d.workout, d.photo].filter(Boolean).length / 3) * 100}%` }} />
                                    </div>
                                </div>

                                {/* Task Checklist */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {d.steps ? <CheckCircle2 size={20} color="var(--accent-gold)" /> : <Circle size={20} color="var(--text-muted)" />}
                                        <span style={{ fontSize: '0.9rem', color: d.steps ? '#fff' : 'var(--text-secondary)', textDecoration: d.steps ? 'line-through' : 'none' }}>
                                            Raggiungi 8000 passi
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {d.workout ? <CheckCircle2 size={20} color="var(--accent-gold)" /> : <Circle size={20} color="var(--text-muted)" />}
                                        <span style={{ fontSize: '0.9rem', color: d.workout ? '#fff' : 'var(--text-secondary)', textDecoration: d.workout ? 'line-through' : 'none' }}>
                                            Completa la sessione di allenamento
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {d.photo ? <CheckCircle2 size={20} color="var(--accent-gold)" /> : <Circle size={20} color="var(--text-muted)" />}
                                        <span style={{ fontSize: '0.9rem', color: d.photo ? '#fff' : 'var(--text-secondary)', textDecoration: d.photo ? 'line-through' : 'none' }}>
                                            Carica una foto pump
                                        </span>
                                    </div>
                                </div>

                                {d.claimed && (
                                    <div className="animate-fade-in" style={{ marginTop: '24px', textAlign: 'center', padding: '16px', background: 'rgba(212,175,55,0.05)', borderRadius: '16px', border: '1px solid rgba(212,175,55,0.1)' }}>
                                        <h4 style={{ color: 'var(--accent-gold)', fontSize: '1rem', fontFamily: 'Outfit', fontWeight: 800 }}>Daily Completed 🎉</h4>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>Ritorna domani per sbloccare di nuovo il bonus giornaliero.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ═══ RIGHT COLUMN (Actions) ═══ */}
                    <div className="flex-col gap-4" style={{ height: '100%' }}>
                        {/* ═══ SECTION 3 – PRIMARY ACTION ═══ */}
                        <button
                            onClick={() => navigate('/training')}
                            className="csv-btn csv-btn-primary-glow"
                            style={{
                                width: '100%',
                                padding: '32px 24px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
                                borderRadius: '16px',
                                flex: 1,
                            }}
                        >
                            <Dumbbell size={32} strokeWidth={2.5} color="#FFF3E0" style={{ filter: 'drop-shadow(0 0 6px rgba(255,120,0,0.6))' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                                <span style={{
                                    fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.4rem',
                                    letterSpacing: '0.04em', textTransform: 'uppercase',
                                    color: '#FFF3E0',
                                    /* Luce Night Shift e Colore Avorio */
                                    textShadow: `
                                        0 0 6px rgba(255, 120, 0, 0.6),
                                        0 0 12px rgba(255, 120, 0, 0.4),
                                        0 0 20px rgba(255, 120, 0, 0.2),
                                        0 0 30px rgba(255, 120, 0, 0.1)
                                    `
                                }}>
                                    Training
                                </span>
                                {program && (
                                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#FFF3E0', opacity: 0.8, textTransform: 'none', letterSpacing: '0' }}>
                                        {program.name}
                                    </span>
                                )}
                            </div>
                        </button>

                        {/* ═══ SECTION 4 – SECONDARY NAVIGATION ═══ */}
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button
                                className="csv-card-3d"
                                style={{
                                    flex: 1,
                                    padding: '24px 16px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                    cursor: 'default',
                                    opacity: 0.45,
                                    position: 'relative',
                                }}
                                disabled
                            >
                                <div style={{
                                    position: 'absolute', top: '-12px', right: '-12px',
                                    background: 'linear-gradient(135deg, rgba(50,50,60,0.95), rgba(20,20,30,1))',
                                    backdropFilter: 'blur(8px)',
                                    WebkitBackdropFilter: 'blur(8px)',
                                    color: '#FFFFFF',
                                    fontSize: '0.62rem', fontWeight: 800, padding: '4px 10px', borderRadius: '6px',
                                    zIndex: 10, textTransform: 'uppercase', letterSpacing: '0.08em',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.2)',
                                    border: '1px solid rgba(255,255,255,0.15)',
                                    transform: 'rotate(6deg)'
                                }}>
                                    Prossimamente
                                </div>
                                <div style={{ color: '#fff' }}><Gamepad2 size={24} strokeWidth={1.5} /></div>
                                <span style={{
                                    fontFamily: 'Outfit', fontWeight: 600, fontSize: '0.9rem',
                                    color: '#fff', letterSpacing: '0.03em',
                                }}>
                                    CSV Games
                                </span>
                            </button>
                            <button
                                className="csv-btn-academy-glow"
                                style={{
                                    flex: 1,
                                    padding: '24px 16px',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
                                    cursor: 'pointer',
                                }}
                                onClick={() => navigate('/academy')}
                            >
                                <PlaySquare size={24} strokeWidth={1.5} color="#e6f0ff" style={{ filter: 'drop-shadow(0 0 6px rgba(179,212,255,0.6))' }} />
                                <span style={{
                                    fontFamily: 'Outfit', fontWeight: 600, fontSize: '0.9rem',
                                    color: '#e6f0ff', letterSpacing: '0.03em',
                                    /* Luce Neon Icy Blue (Academy) con Nucleo Bianco Ghiaccio */
                                    textShadow: `
                                        0 0 6px rgba(179, 212, 255, 0.6),
                                        0 0 12px rgba(179, 212, 255, 0.4),
                                        0 0 20px rgba(179, 212, 255, 0.2)
                                    `
                                }}>
                                    Academy
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* ─── Glass Home Button ─── */
const HomeButton = ({ label, icon, onClick }) => (
    <button
        onClick={onClick}
        className="csv-card-3d"
        style={{
            flex: 1,
            padding: '24px 16px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
            cursor: 'pointer',
        }}
    >
        <div style={{ color: '#fff' }}>{icon}</div>
        <span style={{
            fontFamily: 'Outfit', fontWeight: 600, fontSize: '0.9rem',
            color: '#fff', letterSpacing: '0.03em',
        }}>
            {label}
        </span>
    </button>
);

export default Dashboard;
