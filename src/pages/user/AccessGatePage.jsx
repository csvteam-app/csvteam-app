import { useAuth } from '../../context/AuthContext';
import CsvLogo from '../../components/ui/CsvLogo';
import { ShieldCheck, MessageCircle, ChevronRight, LogOut } from 'lucide-react';

/**
 * Unified access gate page.
 * Shown when user is logged in but neither approved by coach nor has active package.
 * Premium, branded, conversion-oriented design.
 */
const AccessGatePage = () => {
    const { logout, profile } = useAuth();
    const firstName = profile?.full_name?.split(' ')[0] || 'Atleta';

    return (
        <div style={styles.page}>
            {/* Ambient glow */}
            <div style={styles.glowTop} />
            <div style={styles.glowBottom} />

            <div style={styles.container} className="animate-fade-in">
                {/* Logo */}
                <div style={styles.logoWrap}>
                    <CsvLogo size={64} showText={false} />
                </div>

                {/* Brand */}
                <h2 style={styles.brand}>
                    CSV <span style={{ color: '#D4AF37' }}>TEAM</span>
                </h2>

                {/* Icon */}
                <div style={styles.iconWrap}>
                    <ShieldCheck size={36} color="#D4AF37" strokeWidth={1.5} />
                </div>

                {/* Title */}
                <h1 style={styles.title}>
                    {firstName}, il tuo accesso non è ancora attivo
                </h1>

                {/* Body */}
                <p style={styles.body}>
                    L'accesso all'app CSV Team è riservato agli atleti con un pacchetto attivo
                    o approvati direttamente dal coach.
                </p>

                {/* Info card */}
                <div style={styles.infoCard}>
                    <p style={styles.infoTitle}>Come sbloccare l'accesso:</p>
                    <div style={styles.infoItem}>
                        <span style={styles.infoNum}>1</span>
                        <span style={styles.infoText}>Attiva un pacchetto di coaching</span>
                    </div>
                    <div style={styles.infoItem}>
                        <span style={styles.infoNum}>2</span>
                        <span style={styles.infoText}>Oppure richiedi l'approvazione del coach</span>
                    </div>
                </div>

                {/* Primary CTA */}
                <button
                    onClick={() => window.open('https://csvteam.com', '_blank')}
                    style={styles.primaryBtn}
                >
                    Attiva il tuo percorso
                    <ChevronRight size={18} />
                </button>

                {/* Secondary CTA */}
                <button
                    onClick={() => window.open('https://wa.me/393331234567', '_blank')}
                    style={styles.contactBtn}
                >
                    <MessageCircle size={16} />
                    Contatta il coach
                </button>

                {/* Logout */}
                <button onClick={logout} style={styles.logoutBtn}>
                    <LogOut size={14} />
                    Esci dall'account
                </button>
            </div>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100dvh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#050508',
        padding: '24px 16px',
        position: 'relative', overflow: 'hidden',
    },
    glowTop: {
        position: 'absolute', top: '-140px', right: '-100px',
        width: '420px', height: '420px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.05) 0%, transparent 65%)',
        pointerEvents: 'none',
    },
    glowBottom: {
        position: 'absolute', bottom: '-120px', left: '-80px',
        width: '380px', height: '380px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.03) 0%, transparent 65%)',
        pointerEvents: 'none',
    },
    container: {
        maxWidth: 440, width: '100%', textAlign: 'center',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '12px', position: 'relative', zIndex: 1,
    },
    logoWrap: {
        padding: '16px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)',
    },
    brand: {
        fontFamily: "'Outfit', sans-serif", fontWeight: 800,
        fontSize: '1.2rem', letterSpacing: '0.1em', color: '#fff',
        margin: '-4px 0 8px',
    },
    iconWrap: {
        width: 72, height: 72, borderRadius: '50%',
        background: 'rgba(212,175,55,0.06)',
        border: '1px solid rgba(212,175,55,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'pulse-soft 2.5s ease-in-out infinite',
    },
    title: {
        fontFamily: "'Outfit', sans-serif", fontWeight: 700,
        fontSize: '1.35rem', color: '#fff',
        margin: '8px 0 0', lineHeight: 1.3,
    },
    body: {
        fontFamily: "'Inter', sans-serif", fontSize: '0.88rem',
        lineHeight: 1.6, color: 'rgba(255,255,255,0.55)',
        margin: '4px 0 0', maxWidth: 360,
    },
    infoCard: {
        width: '100%', maxWidth: 360,
        background: 'rgba(212,175,55,0.04)',
        border: '1px solid rgba(212,175,55,0.1)',
        borderRadius: '16px', padding: '18px 20px',
        marginTop: '8px',
        display: 'flex', flexDirection: 'column', gap: '12px',
    },
    infoTitle: {
        fontFamily: "'Outfit', sans-serif", fontWeight: 600,
        fontSize: '0.78rem', letterSpacing: '0.06em',
        textTransform: 'uppercase', color: '#D4AF37',
        margin: 0, textAlign: 'left',
    },
    infoItem: {
        display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left',
    },
    infoNum: {
        width: 24, height: 24, borderRadius: '50%',
        background: 'rgba(212,175,55,0.12)',
        border: '1px solid rgba(212,175,55,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Outfit', sans-serif", fontWeight: 700,
        fontSize: '0.72rem', color: '#D4AF37',
        flexShrink: 0,
    },
    infoText: {
        fontFamily: "'Inter', sans-serif", fontSize: '0.85rem',
        color: 'rgba(255,255,255,0.7)',
    },
    primaryBtn: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '8px', width: '100%', maxWidth: 340,
        padding: '15px 28px', marginTop: '8px',
        background: 'linear-gradient(135deg, #D4AF37, #C4982A)',
        border: 'none', borderRadius: '14px',
        color: '#050508', fontFamily: "'Outfit', sans-serif",
        fontWeight: 700, fontSize: '1rem',
        cursor: 'pointer', transition: 'all 0.2s ease',
        boxShadow: '0 4px 24px rgba(212,175,55,0.25)',
    },
    contactBtn: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '8px', width: '100%', maxWidth: 340,
        padding: '13px 24px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '12px',
        color: 'rgba(255,255,255,0.7)',
        fontFamily: "'Inter', sans-serif", fontWeight: 600,
        fontSize: '0.88rem', cursor: 'pointer',
        transition: 'all 0.2s ease',
    },
    logoutBtn: {
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '6px',
        fontFamily: "'Outfit', sans-serif", fontWeight: 600,
        fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)',
        background: 'transparent', border: 'none',
        padding: '8px', cursor: 'pointer', marginTop: '8px',
    },
};

export default AccessGatePage;
