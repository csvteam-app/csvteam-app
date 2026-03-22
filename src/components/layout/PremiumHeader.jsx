import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogIn } from 'lucide-react';

/**
 * Minimal top-right auth pill.
 * Tapping navigates to /profile (which includes login, profile, shop, logout).
 */
const PremiumHeader = () => {
    const navigate = useNavigate();
    const { profile, isAuthenticated } = useAuth();

    const initial = isAuthenticated && profile
        ? (profile.full_name || 'U').charAt(0).toUpperCase()
        : null;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            zIndex: 100,
            paddingTop: 'calc(4px + env(safe-area-inset-top))',
            paddingRight: '12px',
        }}>
            {isAuthenticated ? (
                <button
                    onClick={() => navigate('/profile')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        cursor: 'pointer', padding: '4px 10px 4px 4px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '20px',
                    }}
                >
                    <div style={{
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: 'var(--gradient-primary, linear-gradient(135deg, #D4AF37, #F0A500))',
                        color: '#050508', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.65rem', fontFamily: 'Outfit',
                    }}>
                        {initial}
                    </div>
                </button>
            ) : (
                <button onClick={() => navigate('/profile')} style={{
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
