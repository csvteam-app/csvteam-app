import { useAuth } from '../../context/AuthContext';

/**
 * Full-screen status page shown when user's approval_status is 'pending'.
 * All app features are locked until admin approves the account.
 */
const PendingApprovalPage = () => {
  const { logout } = useAuth();

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Animated clock icon */}
        <div style={styles.iconWrap}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-icy)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h1 style={styles.title}>Account in attesa di approvazione</h1>

        <p style={styles.body}>
          La tua registrazione è stata ricevuta. Il coach esaminerà la richiesta
          e attiverà il tuo account il prima possibile.
        </p>

        <p style={styles.sub}>
          Riceverai una notifica non appena il tuo account sarà attivo.
        </p>

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
    background: 'var(--status-yellow-soft)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    boxShadow: 'var(--status-yellow-glow)',
    animation: 'pulse-soft 2.5s ease-in-out infinite',
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
    margin: '0 0 0.75rem',
  },
  sub: {
    fontFamily: "'Inter', sans-serif",
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    margin: '0 0 1.75rem',
  },
  logoutBtn: {
    fontFamily: "'Outfit', sans-serif",
    fontWeight: 600,
    fontSize: '0.88rem',
    color: 'var(--text-secondary)',
    background: 'var(--surface-color-2)',
    border: '1px solid var(--glass-border)',
    borderRadius: 12,
    padding: '0.65rem 2rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
};

export default PendingApprovalPage;
