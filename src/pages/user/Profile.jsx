import { useNavigate } from 'react-router-dom';
import { useGamification } from '../../hooks/useGamification';
import { useAuth } from '../../context/AuthContext';
import { useAppContext } from '../../context/AppContext';
import FEATURE_FLAGS from '../../config/featureFlags';
import { Trophy, Flame, Dumbbell, Target, CheckCircle2, History, Camera, User, Calendar, Crown } from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();
    const { state } = useAppContext();
    const { user, profile: authProfile } = useAuth();
    const { gamification, LEAGUES } = useGamification();

    const xp = gamification?.xp || 0;
    const u = { name: authProfile?.full_name || user?.user_metadata?.name || 'Utente CSV' };
    const timeline = []; // Mock timeline, should be fetched if needed

    const currentLeague = LEAGUES.find(l => l.id === gamification?.current_league) || LEAGUES[0];
    const nextLeague = LEAGUES.find(l => l.threshold > xp) || LEAGUES[LEAGUES.length - 1];
    const xpForNext = nextLeague ? nextLeague.threshold : xp;
    const progressPerc = nextLeague ? Math.min((xp / xpForNext) * 100, 100) : 100;

    const workoutsCompleted = gamification?.workouts_completed || 0;
    const bestStreak = gamification?.best_streak || 0;
    const currentStreak = gamification?.streak_days || 0;

    // Timeline Icon Mapper
    const getTimelineIcon = (type) => {
        switch (type) {
            case 'workout': return <Dumbbell size={16} color="#fff" />;
            case 'photo': return <Camera size={16} color="#fff" />;
            case 'challenge': return <Trophy size={16} color="#fff" />;
            case 'streak': return <Flame size={16} color="#fff" />;
            default: return <CheckCircle2 size={16} color="#fff" />;
        }
    };

    // Date formatter
    const formatDate = (isoString) => {
        const date = new Date(isoString);
        const today = new Date();
        const diffMs = today - date;
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays === 0) return 'Oggi';
        if (diffDays === 1) return 'Ieri';
        return `${diffDays} giorni fa`;
    };

    return (
        <div className="global-container animate-fade-in" style={{ paddingBottom: '120px' }}>

            {/* 1. USER HEADER */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '24px', marginBottom: '32px' }}>
                <div style={{
                    width: '80px', height: '80px', borderRadius: '40px',
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.2) 0%, rgba(212,175,55,0.05) 100%)',
                    border: '1px solid rgba(212,175,55,0.3)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    marginBottom: '16px', boxShadow: '0 8px 32px rgba(212,175,55,0.1)'
                }}>
                    <User size={36} color="var(--accent-gold)" />
                </div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'Outfit', color: '#fff' }}>
                    {u.name}
                </h1>
                <span className="text-small text-muted" style={{ marginTop: '4px' }}>Elite Member</span>

                {user?.user_metadata?.subscription_status === 'active' && (
                    <div style={{
                        marginTop: '16px', padding: '12px 24px', borderRadius: '12px',
                        background: 'linear-gradient(90deg, rgba(212,175,55,0.1) 0%, rgba(212,175,55,0.2) 100%)',
                        border: '1px solid rgba(212,175,55,0.4)', display: 'flex', alignItems: 'center', gap: '12px',
                        boxShadow: '0 4px 12px rgba(212,175,55,0.1)'
                    }}>
                        <Crown size={20} color="var(--accent-gold)" />
                        <div className="flex-col">
                            <span style={{ fontSize: '0.75rem', color: '#fff', opacity: 0.8, fontWeight: 600 }}>Piano Attivo</span>
                            <span style={{ fontSize: '1rem', color: 'var(--accent-gold)', fontWeight: 800, fontFamily: 'Outfit' }}>{user?.user_metadata?.subscription_plan || 'Coaching Premium'}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* RESPONSIVE CONTENT GRID */}
            <div className="responsive-grid-2col w-full" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* ═══ LEFT COLUMN (Stats & Settings) ═══ */}
                <div className="flex-col gap-6">
                    {/* 2. PROGRESS SUMMARY (solo se XP attivo) */}
                    {FEATURE_FLAGS.XP && (
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                <div>
                                    <span className="text-label" style={{ color: 'var(--text-muted)' }}>LEGA ATTUALE</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        <span style={{ fontSize: '1.5rem' }}>{currentLeague.icon}</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit', color: '#fff' }}>
                                            Lega {currentLeague.name}
                                        </span>
                                    </div>
                                </div>

                                {FEATURE_FLAGS.STREAK && (
                                    <div style={{ textAlign: 'right' }}>
                                        <span className="text-label" style={{ color: 'var(--text-muted)' }}>STREAK</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', justifyContent: 'flex-end' }}>
                                            <Flame size={16} color="var(--accent-coral)" />
                                            <span style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit', color: '#fff' }}>
                                                {currentStreak} Giorni
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                                        {xp} XP
                                    </span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        / {xpForNext} XP
                                    </span>
                                </div>
                                <div className="progress-bar-premium" style={{ height: '8px' }}>
                                    <div className="progress-fill" style={{ width: `${progressPerc}%` }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. QUICK STATS (solo se gamification attiva) */}
                    {FEATURE_FLAGS.XP && (
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit', color: '#fff', marginBottom: '16px' }}>
                                Statistiche rapide
                            </h3>
                            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', msOverflowStyle: 'none', scrollbarWidth: 'none' }} className="no-scrollbar">
                                {/* Stat 1 */}
                                <div className="glass-card flex-col items-center justify-center p-4" style={{ minWidth: '110px', flex: 1 }}>
                                    <Dumbbell size={20} color="var(--accent-teal)" style={{ marginBottom: '8px' }} />
                                    <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit', color: '#fff', lineHeight: 1 }}>{workoutsCompleted}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>Workout Totali</span>
                                </div>

                                {/* Stat 2 */}
                                <div className="glass-card flex-col items-center justify-center p-4" style={{ minWidth: '110px', flex: 1 }}>
                                    <Target size={20} color="var(--accent-warm)" style={{ marginBottom: '8px' }} />
                                    <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit', color: '#fff', lineHeight: 1 }}>34</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>Sfide Vinte</span>
                                </div>

                                {/* Stat 3 */}
                                <div className="glass-card flex-col items-center justify-center p-4" style={{ minWidth: '110px', flex: 1 }}>
                                    <Flame size={20} color="var(--accent-coral)" style={{ marginBottom: '8px' }} />
                                    <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit', color: '#fff', lineHeight: 1 }}>{bestStreak}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'center' }}>Best Streak</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NAVIGAZIONE AGGIUNTIVA */}
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit', color: '#fff', marginBottom: '16px' }}>
                            Impostazioni Lezioni
                        </h3>
                        <div
                            onClick={() => navigate('/profile/availability')}
                            className="glass-card flex-row items-center justify-between"
                            style={{ padding: '20px 16px', cursor: 'pointer', borderLeft: '3px solid var(--accent-gold)' }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(212,175,55,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <Calendar size={22} color="var(--accent-gold)" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '1rem' }}>La mia Disponibilità</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Gestisci i tuoi orari per le lezioni</div>
                                </div>
                            </div>
                            <div style={{ color: 'var(--text-muted)' }}>→</div>
                        </div>
                    </div>
                </div>

                {/* ═══ RIGHT COLUMN (Timeline) ═══ */}
                <div className="glass-card" style={{ padding: '24px', height: 'fit-content' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                        <History size={18} color="var(--accent-gold)" />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'Outfit', color: '#fff' }}>
                            Cronologia Progressi
                        </h3>
                    </div>

                    <div style={{ position: 'relative', paddingLeft: '16px' }}>
                        {/* Vertical Line */}
                        <div style={{ position: 'absolute', top: 0, bottom: 0, left: '32px', width: '2px', background: 'var(--glass-border)' }} />

                        {timeline.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0' }}>Nessuna attività registrata.</p>
                        ) : (
                            timeline.map((event, index) => (
                                <div key={event.id} className="animate-fade-in" style={{ display: 'flex', gap: '24px', marginBottom: '32px', position: 'relative', animationDelay: `${index * 50}ms` }}>
                                    {/* Icon Bubble */}
                                    <div style={{
                                        width: '34px', height: '34px', borderRadius: '17px',
                                        background: 'linear-gradient(135deg, #1A1A24 0%, #0F0F16 100%)',
                                        border: '1px solid var(--glass-border)', zIndex: 2,
                                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                                    }}>
                                        {getTimelineIcon(event.type)}
                                    </div>

                                    {/* Content */}
                                    <div style={{ flex: 1, paddingTop: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                            <h4 style={{ color: '#fff', fontSize: '1rem', fontWeight: 600 }}>{event.title}</h4>
                                            {event.xpGained && (
                                                <span style={{ color: 'var(--accent-gold)', fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                                    +{event.xpGained} XP
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                                            {formatDate(event.date)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Profile;
