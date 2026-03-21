import { useAuth } from '../../context/AuthContext';

/**
 * Shown when an approved user's subscription has expired or is inactive.
 * Links to renewal / contact. All app features are locked.
 */
const ExpiredSubscriptionPage = () => {
  const { logout, profile } = useAuth();

  const planLabel = profile?.subscription_plan
    ? profile.subscription_plan.charAt(0).toUpperCase() + profile.subscription_plan.slice(1)
    : 'Base';

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Lock icon */}
        <div style={styles.iconWrap}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--accent-coral)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1 style={styles.title}>Abbonamento non attivo</h1>

        <p style={styles.body}>
          Il tuo piano <strong style={{ color: 'var(--text-main)' }}>{planLabel}</strong> non è
          attualmente attivo. Per continuare ad usare CSV Team, rinnova il tuo
          abbonamento o contatta il coach.
        </p>

        {profile?.subscription_expires_at && (
          <p style={styles.expiry}>
            Scaduto il: {new Date(profile.subscription_expires_at).toLocaleDateString('it-IT', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        )}

        <a
          href="https://www.csvteam.com/pricing"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.renewBtn}
        >
          Rinnova Abbonamento
        </a>

        <button onClick={logout} style={styles.logoutBtn}>
          Esci
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg-color)',
    padding: '1.5rem',
  },
  card: {
    maxWidth: 420,
    width: '100%',
    textAlign: 'center',
    background: 'var(--glass-bg)',
    backdropFilter: 'blur(var(--glass-blur))',
    WebkitBackdropFilter: 'blur(var(--glass-blur))',
    border: '1px solid var(--glass-border)',
    borderRadius: 20,
    padding: '2.5rem 2rem',
    boxShadow: 'var(--glass-shadow)',
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: '50%',
    background: 'var(--status-red-soft)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    boxShadow: 'var(--status-red-glow)',
  },
  title: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 700,
    fontSize: '1.35rem',
    color: 'var(--text-main)',
    margin: '0 0 1rem',
  },
  body: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.92rem',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
    margin: '0 0 0.5rem',
  },
  expiry: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    margin: '0 0 1.75rem',
  },
  renewBtn: {
    display: 'inline-block',
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 600,
    fontSize: '0.92rem',
    color: '#fff',
    background: 'var(--accent-warm)',
    border: 'none',
    borderRadius: 12,
    padding: '0.75rem 2rem',
    textDecoration: 'none',
    cursor: 'pointer',
    marginBottom: '0.75rem',
    transition: 'all 0.2s ease',
    boxShadow: 'var(--accent-warm-glow) 0 4px 20px',
  },
  logoutBtn: {
    display: 'block',
    width: '100%',
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 600,
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    background: 'transparent',
    border: 'none',
    padding: '0.6rem',
    cursor: 'pointer',
    marginTop: '0.25rem',
  },
};

export default ExpiredSubscriptionPage;
