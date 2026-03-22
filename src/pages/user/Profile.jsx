import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useGamification } from '../../hooks/useGamification';
import { useAuth } from '../../context/AuthContext';
import FEATURE_FLAGS from '../../config/featureFlags';
import Shop from './Shop';
import {
    Trophy, Flame, Dumbbell, Target, CheckCircle2, History, User, Calendar,
    Crown, LogIn, LogOut, Shield, ArrowLeft, Mail, Lock, Eye, EyeOff
} from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();
    const { user, profile: authProfile, isAuthenticated, signIn, signOut, role } = useAuth();
    const { gamification, LEAGUES } = useGamification();
    const isCoach = ['coach', 'superadmin'].includes(role);

    // Login form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoginLoading(true);
        const { error } = await signIn(email, password);
        if (error) {
            setLoginError(error.message === 'Invalid login credentials' ? 'Email o password non corretti' : error.message);
        }
        setLoginLoading(false);
    };

    // Gamification data
    const xp = gamification?.xp || 0;
    const u = { name: authProfile?.full_name || user?.user_metadata?.name || 'Utente CSV' };

    const currentLeague = LEAGUES.find(l => l.id === gamification?.current_league) || LEAGUES[0];
    const nextLeague = LEAGUES.find(l => l.threshold > xp) || LEAGUES[LEAGUES.length - 1];
    const xpForNext = nextLeague ? nextLeague.threshold : xp;
    const progressPerc = nextLeague ? Math.min((xp / xpForNext) * 100, 100) : 100;

    const workoutsCompleted = gamification?.workouts_completed || 0;
    const bestStreak = gamification?.best_streak || 0;
    const currentStreak = gamification?.streak_days || 0;

    const btnStyle = {
        display: 'flex', alignItems: 'center', gap: '10px',
        width: '100%', padding: '14px 16px', borderRadius: '14px',
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.04)',
        color: '#fff', cursor: 'pointer', fontSize: '0.88rem',
        fontWeight: 600, fontFamily: 'Outfit', textAlign: 'left',
    };

    // ── NOT LOGGED IN: show login form ──
    if (!isAuthenticated) {
        return (
            <div className="global-container animate-fade-in" style={{ padding: '20px 20px 80px' }}>
                {/* Back button */}
                <button onClick={() => navigate('/dashboard')} style={{
                    ...btnStyle, width: 'auto', padding: '8px 14px',
                    marginBottom: '24px', background: 'none', border: 'none',
                    color: 'var(--text-muted)', fontSize: '0.8rem',
                }}>
                    <ArrowLeft size={16} /> Torna all'app
                </button>

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 16px',
                        background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
                        border: '1px solid rgba(212,175,55,0.3)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center',
                    }}>
                        <LogIn size={28} color="var(--accent-gold)" />
                    </div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Outfit', color: '#fff' }}>
                        Accedi al tuo account
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '8px' }}>
                        Entra per accedere al tuo profilo e allo shop
                    </p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '400px', margin: '0 auto' }}>
                    <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="Email" required autoComplete="email"
                            style={{
                                width: '100%', padding: '14px 14px 14px 40px', borderRadius: '14px',
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff', fontSize: '0.9rem', fontFamily: 'Inter, system-ui', outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type={showPassword ? 'text' : 'password'} value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Password" required autoComplete="current-password"
                            style={{
                                width: '100%', padding: '14px 44px 14px 40px', borderRadius: '14px',
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                color: '#fff', fontSize: '0.9rem', fontFamily: 'Inter, system-ui', outline: 'none',
                                boxSizing: 'border-box',
                            }}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                            position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                        }}>
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    {loginError && (
                        <p style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>{loginError}</p>
                    )}

                    <button type="submit" disabled={loginLoading} style={{
                        padding: '14px', borderRadius: '14px',
                        background: 'var(--gradient-primary, linear-gradient(135deg, #D4AF37, #F0A500))',
                        color: '#050508', border: 'none', fontWeight: 700, fontSize: '0.9rem',
                        fontFamily: 'Outfit', cursor: loginLoading ? 'not-allowed' : 'pointer',
                        opacity: loginLoading ? 0.7 : 1,
                    }}>
                        {loginLoading ? 'Accesso...' : 'Accedi'}
                    </button>
                </form>
            </div>
        );
    }

    // ── LOGGED IN: Profile + Auth Controls + Shop ──
    return (
        <div className="global-container animate-fade-in" style={{ paddingBottom: '80px' }}>

            {/* Back button */}
            <div style={{ padding: '12px 0' }}>
                <button onClick={() => navigate('/dashboard')} style={{
                    ...btnStyle, width: 'auto', padding: '8px 14px',
                    background: 'none', border: 'none',
                    color: 'var(--text-muted)', fontSize: '0.8rem',
                }}>
                    <ArrowLeft size={16} /> Torna all'app
                </button>
            </div>

            {/* 1. USER HEADER */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
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
                    }}>
                        <Crown size={20} color="var(--accent-gold)" />
                        <div className="flex-col">
                            <span style={{ fontSize: '0.75rem', color: '#fff', opacity: 0.8, fontWeight: 600 }}>Piano Attivo</span>
                            <span style={{ fontSize: '1rem', color: 'var(--accent-gold)', fontWeight: 800, fontFamily: 'Outfit' }}>
                                {user?.user_metadata?.subscription_plan || 'Coaching Premium'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. AUTH CONTROLS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px', maxWidth: '500px', margin: '0 auto 32px' }}>
                {isCoach && (
                    <button onClick={() => navigate('/admin/dashboard')} style={{ ...btnStyle, borderColor: 'rgba(212,175,55,0.3)', color: 'var(--accent-gold)' }}>
                        <Shield size={18} /> Pannello Coach
                    </button>
                )}
                <button onClick={() => navigate('/profile/availability')} style={btnStyle}>
                    <Calendar size={18} /> La mia Disponibilità
                </button>
                <button onClick={() => { signOut(); navigate('/dashboard'); }} style={{ ...btnStyle, color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}>
                    <LogOut size={18} /> Disconnetti
                </button>
            </div>

            {/* 3. PROGRESS (se XP attivo) */}
            {FEATURE_FLAGS.XP && (
                <div style={{ maxWidth: '500px', margin: '0 auto 24px' }}>
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
                                <span style={{ fontSize: '0.9rem', color: 'var(--accent-gold)', fontWeight: 700 }}>{xp} XP</span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ {xpForNext} XP</span>
                            </div>
                            <div className="progress-bar-premium" style={{ height: '8px' }}>
                                <div className="progress-fill" style={{ width: `${progressPerc}%` }} />
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <div className="glass-card flex-col items-center justify-center p-4" style={{ flex: 1 }}>
                            <Dumbbell size={18} color="var(--accent-teal)" style={{ marginBottom: '6px' }} />
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit', color: '#fff' }}>{workoutsCompleted}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'center' }}>Workout</span>
                        </div>
                        <div className="glass-card flex-col items-center justify-center p-4" style={{ flex: 1 }}>
                            <Target size={18} color="var(--accent-warm)" style={{ marginBottom: '6px' }} />
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit', color: '#fff' }}>34</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'center' }}>Sfide</span>
                        </div>
                        <div className="glass-card flex-col items-center justify-center p-4" style={{ flex: 1 }}>
                            <Flame size={18} color="var(--accent-coral)" style={{ marginBottom: '6px' }} />
                            <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Outfit', color: '#fff' }}>{bestStreak}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px', textAlign: 'center' }}>Best Streak</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ 4. SHOP (embedded) ═══ */}
            <div style={{
                marginTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: '24px',
            }}>
                <Shop />
            </div>
        </div>
    );
};

export default Profile;
