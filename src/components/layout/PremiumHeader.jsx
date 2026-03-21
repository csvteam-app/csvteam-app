import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CsvLogo from '../ui/CsvLogo';
import Button from '../ui/Button';
import { User, LogIn, LogOut, Menu, X, ChevronDown, Bell, Settings, Shield } from 'lucide-react';

const PremiumHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { profile, isAuthenticated, signOut, role } = useAuth();
    const isCoach = ['coach', 'superadmin'].includes(role);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const user = isAuthenticated && profile ? { name: profile.full_name || 'Utente', email: profile.email || '' } : null;

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close profile dropdown when clicking outside
    useEffect(() => {
        if (!isProfileOpen) return;
        const close = () => setIsProfileOpen(false);
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, [isProfileOpen]);

    return (
        <header
            className={`fixed top-0 left-0 w-full z-100 transition-all duration-300 ${isScrolled ? 'glass' : ''}`}
            style={{
                padding: isScrolled ? '10px 16px' : '16px 16px',
                paddingTop: `calc(${isScrolled ? '10px' : '16px'} + env(safe-area-inset-top))`,
                borderBottom: isScrolled ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent',
                backgroundColor: isScrolled ? 'rgba(5, 5, 8, 0.85)' : 'transparent',
                backdropFilter: isScrolled ? 'blur(16px)' : 'none',
                WebkitBackdropFilter: isScrolled ? 'blur(16px)' : 'none',
            }}
        >
            <div className="max-w-7xl mx-auto flex-row justify-between items-center">

                {/* Logo Section */}
                <div className="flex-row items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                    <CsvLogo size={32} showText={false} />
                    <div className="flex-col hidden md-flex">
                        <span className="text-h2" style={{ fontSize: '1.1rem', letterSpacing: '0.05em' }}>CSV <span style={{ color: 'var(--accent-gold)' }}>TEAM</span></span>
                        <span className="text-label" style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '-4px' }}>ELITE COACHING</span>
                    </div>
                </div>

                {/* desktop Nav */}
                <nav className="hidden lg-flex items-center gap-8">
                    {[
                        { name: 'Shop', path: '/shop' },
                        { name: 'Chat', path: '/chat' },
                        { name: 'Allenamento', path: '/dashboard' },
                        { name: 'Dieta', path: '/nutrition' },
                        { name: 'Profilo', path: '/profile' },
                    ].map(item => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            style={({ isActive }) => ({
                                fontSize: '0.82rem',
                                fontWeight: isActive ? 700 : 400,
                                color: isActive ? '#fff' : 'var(--text-muted)',
                                letterSpacing: '0.03em',
                                transition: 'all 0.25s ease-out',
                                position: 'relative'
                            })}
                            className="hover-text-primary"
                        >
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                {/* User / Actions */}
                <div className="flex-row items-center gap-4">

                    {user ? (
                        <>
                            <div className="hidden sm-flex">
                                <Button variant="ghost" size="icon" className="relative">
                                    <Bell size={18} strokeWidth={1.5} />
                                    <span style={{ position: 'absolute', top: '2px', right: '2px', width: '6px', height: '6px', background: 'var(--accent-gold)', borderRadius: '50%', border: '2px solid var(--bg-color)' }} />
                                </Button>
                            </div>

                            <div className="relative" onClick={(e) => { e.stopPropagation(); setIsProfileOpen(!isProfileOpen); }}>
                                <div
                                    className="flex-row items-center gap-2 cursor-pointer p-1 rounded-full hover-bg-surface"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', paddingRight: '12px' }}
                                >
                                    <div
                                        style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-primary)', color: '#050508', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}
                                    >
                                        {user.name.charAt(0)}
                                    </div>
                                    <span className="hidden sm-block text-small font-bold">{user.name.split(' ')[0]}</span>
                                    <ChevronDown size={14} className={`transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                                </div>

                                {/* Dropdown */}
                                {isProfileOpen && (
                                    <div
                                        className="absolute top-12 right-0 animate-fade-in flex-col gap-1 p-2"
                                        style={{ width: '220px', background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', boxShadow: 'var(--glass-shadow)', zIndex: 200 }}
                                    >
                                        <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <p className="text-small font-bold">{user.name}</p>
                                            <p className="text-small opacity-50" style={{ fontSize: '0.7rem' }}>{user.email}</p>
                                        </div>
                                        <button onClick={() => navigate('/profile')} className="flex-row items-center gap-3 p-3 w-full text-left rounded-lg hover-bg-surface transition-all">
                                            <Settings size={16} /> <span className="text-small">Impostazioni</span>
                                        </button>
                                        {isCoach && (
                                            <button onClick={() => navigate('/admin/dashboard')} className="flex-row items-center gap-3 p-3 w-full text-left rounded-lg hover-bg-surface transition-all" style={{ color: 'var(--accent-gold)' }}>
                                                <Shield size={16} /> <span className="text-small">Pannello Coach</span>
                                            </button>
                                        )}
                                        <button onClick={() => { signOut(); navigate('/auth'); }} className="flex-row items-center gap-3 p-3 w-full text-left rounded-lg text-coral hover-bg-surface transition-all">
                                            <LogOut size={16} /> <span className="text-small">Disconnetti</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-row gap-3">
                            <Button variant="ghost" onClick={() => navigate('/auth')}>Accedi</Button>
                            <Button size="md" onClick={() => navigate('/auth')}>Inizia ora</Button>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <button className="lg-hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div
                    className="fixed inset-0 z-150 lg-hidden animate-fade-in"
                    style={{ background: 'var(--bg-color)', paddingTop: '100px', paddingLeft: '24px', paddingRight: '24px' }}
                >
                    <div className="flex-col gap-6">
                        {[
                            { name: 'Shop', path: '/shop' },
                            { name: 'Chat', path: '/chat' },
                            { name: 'Allenamento', path: '/dashboard' },
                            { name: 'Dieta', path: '/nutrition' },
                            { name: 'Profilo', path: '/profile' },
                        ].map(item => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                onClick={() => setIsMenuOpen(false)}
                                className="text-h1"
                                style={({ isActive }) => ({
                                    color: isActive ? '#fff' : 'var(--text-muted)',
                                    fontSize: '2rem'
                                })}
                            >
                                {item.name}
                            </NavLink>
                        ))}

                        {!user && (
                            <div className="mt-8 flex-col gap-4">
                                <Button size="lg" fullWidth onClick={() => { setIsMenuOpen(false); navigate('/auth'); }}>Accedi / Registrati</Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default PremiumHeader;
