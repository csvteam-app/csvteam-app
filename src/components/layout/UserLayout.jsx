import { useEffect, useState, useRef, useCallback, Component } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import PremiumHeader from './PremiumHeader';
import Navbar from './Navbar';

/* ═══ Direct imports for swipe panels ═══ */
import Nutrition from '../../pages/user/Nutrition';
import Dashboard from '../../pages/user/Dashboard';
import Chat from '../../pages/user/Chat';

/* ═══ Per-page Error Boundary ═══ */
class PageErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorKey: '' };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    static getDerivedStateFromProps(props, state) {
        // Reset error when page changes
        if (props.pageName !== state.errorKey && state.hasError) {
            return { hasError: false, errorKey: props.pageName };
        }
        return { errorKey: props.pageName };
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

/* ═══ Config ═══ */
const TAB_ROUTES = ['/nutrition', '/dashboard', '/chat'];
const TAB_COMPONENTS = [Nutrition, Dashboard, Chat];
const TAB_NAMES = ['nutrition', 'dashboard', 'chat'];

const SNAP_THRESHOLD = 0.3;        // 30% of screen width
const VELOCITY_THRESHOLD = 0.3;    // px per ms
const SNAP_DURATION = 280;         // ms
const SNAP_EASING = 'cubic-bezier(0.25, 1, 0.5, 1)';
const EDGE_RESISTANCE = 0.3;       // drag multiplier at edges
const DIRECTION_LOCK_PX = 10;      // px before locking direction

function getTabIndex(pathname) {
    const exact = TAB_ROUTES.indexOf(pathname);
    if (exact !== -1) return exact;
    if (pathname.startsWith('/chat')) return 2;
    if (pathname.startsWith('/workout') || pathname.startsWith('/training')) return 1;
    return -1;
}

const UserLayout = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const tabIndex = getTabIndex(pathname);
    const isTabRoute = tabIndex !== -1;
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    // Refs for swipe (zero re-renders during gesture)
    const wrapperRef = useRef(null);
    const touchState = useRef({
        startX: 0,
        startY: 0,
        startTime: 0,
        currentX: 0,
        locked: null,   // null | 'h' | 'v'
        dragging: false,
        animating: false,
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Sync wrapper position when route changes (e.g., from navbar tap)
    useEffect(() => {
        if (!wrapperRef.current || !isTabRoute || !isMobile) return;
        const ts = touchState.current;
        if (ts.dragging || ts.animating) return;
        // Instant position (no transition)
        wrapperRef.current.style.transition = 'none';
        wrapperRef.current.style.transform = `translate3d(${-tabIndex * 100}%, 0, 0)`;
    }, [tabIndex, isTabRoute, isMobile]);

    /* ── Touch handlers ── */
    const onTouchStart = useCallback((e) => {
        const ts = touchState.current;
        if (ts.animating) return;
        const touch = e.touches[0];
        ts.startX = touch.clientX;
        ts.startY = touch.clientY;
        ts.currentX = 0;
        ts.startTime = Date.now();
        ts.locked = null;
        ts.dragging = true;

        // Remove transition for direct finger tracking
        if (wrapperRef.current) {
            wrapperRef.current.style.transition = 'none';
        }
    }, []);

    const onTouchMove = useCallback((e) => {
        const ts = touchState.current;
        if (!ts.dragging || ts.animating) return;

        const touch = e.touches[0];
        const dx = touch.clientX - ts.startX;
        const dy = touch.clientY - ts.startY;

        // Direction lock
        if (ts.locked === null) {
            if (Math.abs(dx) > DIRECTION_LOCK_PX || Math.abs(dy) > DIRECTION_LOCK_PX) {
                ts.locked = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
            } else {
                return; // Wait for enough movement
            }
        }

        // Vertical scroll — let browser handle
        if (ts.locked === 'v') return;

        // Horizontal swipe — prevent scroll, track finger
        e.preventDefault();

        let dragX = dx;

        // Edge resistance
        if ((tabIndex === 0 && dx > 0) || (tabIndex === TAB_ROUTES.length - 1 && dx < 0)) {
            dragX = dx * EDGE_RESISTANCE;
        }

        ts.currentX = dragX;

        // Move wrapper — direct DOM manipulation, no React
        if (wrapperRef.current) {
            const baseOffset = -tabIndex * 100;
            const dragPercent = (dragX / window.innerWidth) * 100;
            wrapperRef.current.style.transform = `translate3d(${baseOffset + dragPercent}%, 0, 0)`;
        }
    }, [tabIndex]);

    const onTouchEnd = useCallback(() => {
        const ts = touchState.current;
        if (!ts.dragging) return;
        ts.dragging = false;

        // If locked to vertical or no lock established, do nothing
        if (ts.locked !== 'h') return;

        const dx = ts.currentX;
        const elapsed = Date.now() - ts.startTime;
        const velocity = Math.abs(dx) / Math.max(elapsed, 1);
        const screenWidth = window.innerWidth;
        const threshold = screenWidth * SNAP_THRESHOLD;

        let targetIndex = tabIndex;

        // Check if should snap to next/prev
        if (dx < -threshold || (dx < 0 && velocity > VELOCITY_THRESHOLD)) {
            targetIndex = Math.min(tabIndex + 1, TAB_ROUTES.length - 1);
        } else if (dx > threshold || (dx > 0 && velocity > VELOCITY_THRESHOLD)) {
            targetIndex = Math.max(tabIndex - 1, 0);
        }

        // Animate snap
        ts.animating = true;
        if (wrapperRef.current) {
            wrapperRef.current.style.transition = `transform ${SNAP_DURATION}ms ${SNAP_EASING}`;
            wrapperRef.current.style.transform = `translate3d(${-targetIndex * 100}%, 0, 0)`;
        }

        // After animation, update route
        setTimeout(() => {
            ts.animating = false;
            if (targetIndex !== tabIndex) {
                navigate(TAB_ROUTES[targetIndex]);
            }
        }, SNAP_DURATION);
    }, [tabIndex, navigate]);

    // ── Non-tab routes OR Desktop: standard Outlet rendering ──
    if (!isTabRoute || !isMobile) {
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <PremiumHeader />
                <div key={pathname} style={{
                    flex: 1, minHeight: 0, overflow: 'auto',
                    WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain',
                }}>
                    <PageErrorBoundary pageName={pathname}>
                        <Outlet />
                    </PageErrorBoundary>
                </div>
                {isMobile && <Navbar />}
            </div>
        );
    }

    // ── Mobile tab routes: premium swipe panels ──
    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            <PremiumHeader />

            {/* ═══ SWIPE CONTAINER — overflow hidden, no scroll ═══ */}
            <div
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    touchAction: 'pan-y', // allow vertical scroll, JS handles horizontal
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* ═══ PANELS WRAPPER — moves via translate3d ═══ */}
                <div
                    ref={wrapperRef}
                    style={{
                        display: 'flex',
                        width: `${TAB_ROUTES.length * 100}%`,
                        height: '100%',
                        transform: `translate3d(${-tabIndex * 100}%, 0, 0)`,
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                    }}
                >
                    {TAB_COMPONENTS.map((PageComponent, idx) => (
                        <div
                            key={TAB_NAMES[idx]}
                            style={{
                                width: `${100 / TAB_ROUTES.length}%`,
                                height: '100%',
                                overflow: 'auto',
                                WebkitOverflowScrolling: 'touch',
                                overscrollBehaviorY: 'contain',
                                flexShrink: 0,
                            }}
                        >
                            <PageErrorBoundary pageName={TAB_NAMES[idx]}>
                                <PageComponent />
                            </PageErrorBoundary>
                        </div>
                    ))}
                </div>
            </div>

            {/* ═══ NAVBAR ═══ */}
            <Navbar />
        </div>
    );
};

export default UserLayout;
