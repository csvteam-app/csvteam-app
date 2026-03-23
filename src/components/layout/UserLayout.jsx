import { useEffect, useState, useRef, useCallback, Component } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import PremiumHeader from './PremiumHeader';
import Navbar from './Navbar';

/* ═══ Per-page Error Boundary ═══ */
class PageErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(error, info) {
        console.error('[PageError]', this.props.pageName || 'unknown', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', height: '100%', gap: '16px',
                    padding: '40px 20px', textAlign: 'center',
                }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Errore nel caricamento della pagina
                    </p>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        style={{
                            padding: '12px 24px', borderRadius: '12px',
                            background: 'var(--gradient-primary, linear-gradient(135deg, #D4AF37, #F0A500))',
                            color: '#050508', border: 'none', fontWeight: 700,
                            fontFamily: "'Outfit', sans-serif", fontSize: '0.85rem',
                            cursor: 'pointer', touchAction: 'manipulation',
                        }}
                    >
                        Riprova
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

/* ═══ TAB ORDER ═══ */
const TAB_ROUTES = ['/nutrition', '/dashboard', '/chat'];

function getTabIndex(pathname) {
    const exact = TAB_ROUTES.indexOf(pathname);
    if (exact !== -1) return exact;
    if (pathname.startsWith('/chat')) return 2;
    if (pathname.startsWith('/workout') || pathname.startsWith('/training')) return 1;
    return -1;
}

/* ═══ Swipe gesture config ═══ */
const SWIPE_THRESHOLD = 50;       // min px horizontal to trigger
const SWIPE_RATIO = 1.5;          // dx must be > dy * ratio (avoid vertical scroll false triggers)

const UserLayout = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const tabIndex = getTabIndex(pathname);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    // Swipe tracking refs (no re-renders during gesture)
    const touchRef = useRef({ startX: 0, startY: 0, swiping: false });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    /* ── Swipe handlers ── */
    const onTouchStart = useCallback((e) => {
        const touch = e.touches[0];
        touchRef.current = {
            startX: touch.clientX,
            startY: touch.clientY,
            swiping: true,
        };
    }, []);

    const onTouchEnd = useCallback((e) => {
        const ref = touchRef.current;
        if (!ref.swiping) return;
        ref.swiping = false;

        const touch = e.changedTouches[0];
        const dx = touch.clientX - ref.startX;
        const dy = touch.clientY - ref.startY;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        // Must exceed threshold and be primarily horizontal
        if (absDx < SWIPE_THRESHOLD || absDx < absDy * SWIPE_RATIO) return;

        // Only swipe on tab routes
        if (tabIndex === -1) return;

        if (dx < 0 && tabIndex < TAB_ROUTES.length - 1) {
            // Swipe left → next tab
            navigate(TAB_ROUTES[tabIndex + 1]);
        } else if (dx > 0 && tabIndex > 0) {
            // Swipe right → previous tab
            navigate(TAB_ROUTES[tabIndex - 1]);
        }
    }, [tabIndex, navigate]);

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            <PremiumHeader />

            {/* ═══ PAGE CONTENT ═══ */}
            <div
                key={pathname}
                onTouchStart={isMobile ? onTouchStart : undefined}
                onTouchEnd={isMobile ? onTouchEnd : undefined}
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehaviorY: 'contain',
                }}
            >
                <PageErrorBoundary pageName={pathname}>
                    <Outlet />
                </PageErrorBoundary>
            </div>

            {/* ═══ NAVBAR ═══ */}
            {isMobile && <Navbar />}
        </div>
    );
};

export default UserLayout;
