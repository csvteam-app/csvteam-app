import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn, LogOut, Shield, ChevronDown, Settings } from 'lucide-react';

/**
 * Minimal top bar — only shows login/logout/coach panel button.
 * Takes absolute minimum vertical space.
 */
const PremiumHeader = () => {
    const navigate = useNavigate();
    const { profile, isAuthenticated, signOut, role } = useAuth();
    const isCoach = ['coach', 'superadmin'].includes(role);
    const [isOpen, setIsOpen] = useState(false);

    const user = isAuthenticated && profile
        ? { name: profile.full_name || 'Utente', email: profile.email || '' }
        : null;

    // Close dropdown on outside click
    useEffect(() => {
        if (!isOpen) return;
        const close = () => setIsOpen(false);
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, [isOpen]);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 100,
            paddingTop: 'calc(4px + env(safe-area-inset-top))',
            paddingRight: '12px',
        }}>
            {user ? (
                <div className="relative" onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
                    {/* Compact avatar pill */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        cursor: 'pointer', padding: '4px 10px 4px 4px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '20px',
                    }}>
                        <div style={{
                            width: '26px', height: '26px', borderRadius: '50%',
                            background: 'var(--gradient-primary, linear-gradient(135deg, #D4AF37, #F0A500))',
                            color: '#050508', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '0.65rem', fontFamily: 'Outfit',
                        }}>
                            {user.name.charAt(0)}
                        </div>
                        <ChevronDown size={12} style={{
                            color: 'var(--text-muted)',
                            transition: 'transform 0.2s',
                            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                        }} />
                    </div>

                    {/* Dropdown */}
                    {isOpen && (
                        <div style={{
                            position: 'absolute', top: '36px', right: 0, width: '200px',
                            background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(16px)',
                            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px',
                            boxShadow: '0 8px 32px rgba(0,0,0,0.6)', zIndex: 200,
                            padding: '6px', display: 'flex', flexDirection: 'column', gap: '2px',
                        }}>
                            <div style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <p style={{ fontWeight: 700, fontSize: '0.8rem', color: '#fff', margin: 0 }}>{user.name}</p>
                                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', margin: 0 }}>{user.email}</p>
                            </div>
                            <button onClick={() => navigate('/profile')} style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                                background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
                                borderRadius: '8px', fontSize: '0.78rem', width: '100%', textAlign: 'left',
                            }}>
                                <Settings size={14} /> Impostazioni
                            </button>
                            {isCoach && (
                                <button onClick={() => navigate('/admin/dashboard')} style={{
                                    display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                                    background: 'none', border: 'none', color: 'var(--accent-gold)', cursor: 'pointer',
                                    borderRadius: '8px', fontSize: '0.78rem', width: '100%', textAlign: 'left',
                                }}>
                                    <Shield size={14} /> Pannello Coach
                                </button>
                            )}
                            <button onClick={() => { signOut(); navigate('/auth'); }} style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                                background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer',
                                borderRadius: '8px', fontSize: '0.78rem', width: '100%', textAlign: 'left',
                            }}>
                                <LogOut size={14} /> Disconnetti
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <button onClick={() => navigate('/auth')} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '20px', padding: '6px 14px 6px 10px',
                    color: '#fff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                    fontFamily: 'Outfit',
                }}>
                    <LogIn size={14} /> Accedi
                </button>
            )}
        </div>
    );
};

export default PremiumHeader;
