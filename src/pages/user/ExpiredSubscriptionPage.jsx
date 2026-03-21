import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CsvLogo from '../../components/ui/CsvLogo';
import { RefreshCw, MessageCircle, ChevronRight } from 'lucide-react';

/**
 * Shown when an approved user's subscription has expired or is inactive.
 * Conversion-focused, premium design. Links to renewal, shop, and coach chat.
 */
const ExpiredSubscriptionPage = () => {
    const { logout, profile } = useAuth();
    const navigate = useNavigate();

    const firstName = profile?.full_name?.split(' ')[0] || 'Atleta';

    const planLabel = profile?.subscription_plan
        ? profile.subscription_plan.charAt(0).toUpperCase() + profile.subscription_plan.slice(1)
        : null;

    return (
        <div style={styles.page}>
            {/* Ambient glow */}
            <div style={styles.glowTop} />

            <div style={styles.container} className="animate-fade-in">
                {/* Logo */}
                <div style={styles.logoWrap}>
                    <CsvLogo size={56} showText={false} />
                </div>

                {/* Icon */}
                <div style={styles.iconWrap}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-coral, #ff6b6b)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                </div>

                {/* Title */}
                <h1 style={styles.title}>
                    Ciao {firstName}, il tuo pacchetto è scaduto
                </h1>

                {/* Body */}
                <p style={styles.body}>
                    {planLabel
                        ? <>Il tuo piano <strong style={{ color: '#fff' }}>{planLabel}</strong> non è più attivo.</>
                        : <>Il tuo abbonamento non è attualmente attivo.</>
                    }
                    {' '}Per continuare il tuo percorso senza interruzioni, rinnova ora.
                </p>

                {/* Expiry date */}
                {profile?.subscription_expires_at && (
                    <p style={styles.expiry}>
                        Scaduto il: {new Date(profile.subscription_expires_at).toLocaleDateString('it-IT', {
                            day: 'numeric', month: 'long', year: 'numeric',
                        })}
                    </p>
                )}

                {/* Motivational nudge */}
                <div style={styles.nudge}>
                    <p style={styles.nudgeText}>
                        💪 Ogni giorno conta. Non lasciare che una pausa interrompa i risultati
                        che hai costruito con impegno.
                    </p>
                </div>

                {/* Primary CTA — Rinnova */}
                <button onClick={() => navigate('/shop')} style={styles.renewBtn}>
                    <RefreshCw size={18} />
                    Rinnova il tuo piano
                </button>

                {/* Link — Altri piani */}
                <button onClick={() => navigate('/shop')} style={styles.plansLink}>
                    Scopri gli altri piani
                    <ChevronRight size={16} />
                </button>

                {/* Secondary CTA — Contatta Daniele */}
                <button onClick={() => navigate('/chat')} style={styles.contactBtn}>
                    <MessageCircle size={16} />
                    Contatta Daniele
                </button>

                {/* Logout */}
                <button onClick={logout} style={styles.logoutBtn}>
                    Esci
                </button>
            </div>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100dvh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-color, #050508)',
        padding: '24px 16px',
        position: 'relative', overflow: 'hidden',
    },
    glowTop: {
        position: 'absolute', top: '-100px', right: '-60px',
        width: '350px', height: '350px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,107,107,0.05) 0%, transparent 65%)',
        pointerEvents: 'none',
    },
    container: {
        maxWidth: 440, width: '100%', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '12px', position: 'relative', zIndex: 1,
    },
    logoWrap: {
        marginBottom: '8px',
        padding: '12px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.06) 0%, transparent 70%)',
    },
    iconWrap: {
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(255,107,107,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 30px rgba(255,107,107,0.1)',
        animation: 'pulse-soft 2.5s ease-in-out infinite',
    },
    title: {
        fontFamily: "'Outfit', sans-serif", fontWeight: 700,
        fontSize: '1.4rem', color: '#fff',
        margin: '12px 0 4px', lineHeight: 1.3,
    },
    body: {
        fontFamily: "'Inter', sans-serif", fontSize: '0.9rem',
        lineHeight: 1.6, color: 'var(--text-secondary, #aaa)',
        margin: 0, maxWidth: 360,
    },
    expiry: {
        fontFamily: "'Inter', sans-serif", fontSize: '0.78rem',
        color: 'var(--text-muted, #666)', margin: 0,
    },
    nudge: {
        background: 'rgba(212,175,55,0.06)',
        border: '1px solid rgba(212,175,55,0.12)',
        borderRadius: '14px', padding: '14px 20px',
        maxWidth: 360, marginTop: '8px',
    },
    nudgeText: {
        fontFamily: "'Inter', sans-serif", fontSize: '0.82rem',
        color: 'var(--text-secondary, #aaa)', lineHeight: 1.5, margin: 0,
    },
    renewBtn: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', width: '100%', maxWidth: 340,
        padding: '15px 28px', marginTop: '12px',
        background: 'var(--accent-warm, #F0A500)',
        border: 'none', borderRadius: '14px',
        color: '#000', fontFamily: "'Outfit', sans-serif",
        fontWeight: 700, fontSize: '1rem',
        cursor: 'pointer', transition: 'all 0.2s ease',
        boxShadow: '0 4px 24px rgba(240,165,0,0.25)',
    },
    plansLink: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '4px', background: 'none', border: 'none',
        color: 'var(--accent-gold, #D4AF37)',
        fontFamily: "'Inter', sans-serif", fontWeight: 600,
        fontSize: '0.85rem', cursor: 'pointer',
        padding: '6px 0',
    },
    contactBtn: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '8px', width: '100%', maxWidth: 340,
        padding: '12px 24px', marginTop: '4px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        color: 'var(--text-secondary, #ccc)',
        fontFamily: "'Inter', sans-serif", fontWeight: 600,
        fontSize: '0.88rem', cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    logoutBtn: {
        display: 'block',
        fontFamily: "'Outfit', sans-serif", fontWeight: 600,
        fontSize: '0.82rem', color: 'var(--text-muted, #666)',
        background: 'transparent', border: 'none',
        padding: '8px', cursor: 'pointer', marginTop: '8px',
    },
};

export default ExpiredSubscriptionPage;
