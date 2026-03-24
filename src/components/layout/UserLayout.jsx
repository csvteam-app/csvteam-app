import { useEffect, useState, useRef, useCallback, Suspense, Component } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import PremiumHeader from './PremiumHeader';
import Navbar from './Navbar';

/* ═══ Direct imports for swipe panels ═══ */
import Nutrition from '../../pages/user/Nutrition';
import Dashboard from '../../pages/user/Dashboard';
import Chat from '../../pages/user/Chat';

/* ═══ DEBUG: Layout measurement overlay ═══ */
function LayoutDebugOverlay() {
    const [metrics, setMetrics] = useState('');
    useEffect(() => {
        const measure = () => {
            const ids = [
                ['#root', '#root'],
                ['LAYOUT', '[data-dbg="layout"]'],
                ['SWIPE_CTR', '[data-dbg="swipe-ctr"]'],
                ['PANEL', '[data-dbg="panel-active"]'],
                ['DASH', '[data-dbg="dashboard"]'],
                ['LOGO', '[data-dbg="logo"]'],
                ['CARDS', '[data-dbg="cards"]'],
                ['NAVBAR', '[data-dbg="navbar"]'],
            ];
            const lines = ids.map(([name, sel]) => {
                const el = document.querySelector(sel);
                if (!el) return `${name}: NOT FOUND`;
                const r = el.getBoundingClientRect();
                return `${name} t:${Math.round(r.top)} b:${Math.round(r.bottom)} h:${Math.round(r.height)}`;
            });
            lines.push(`VP: ${window.innerWidth}x${window.innerHeight}`);
            lines.push(`SAI-T: ${getComputedStyle(document.documentElement).getPropertyValue('--sat') || '?'}`);
            setMetrics(lines.join('\n'));
        };
        measure();
        const id = setInterval(measure, 2000);
        return () => clearInterval(id);
    }, []);
    return (
        <pre style={{
            position: 'fixed', bottom: '80px', left: '4px', right: '4px',
            zIndex: 99999, background: 'rgba(0,0,0,0.92)', color: '#0f0',
            fontFamily: 'monospace', fontSize: '9px', lineHeight: '13px',
            padding: '6px 8px', borderRadius: '8px', pointerEvents: 'none',
            whiteSpace: 'pre-wrap',
        }}>
            {metrics}
        </pre>
    );
}

const DBG_LABEL = (name, color) => ({
    position: 'absolute', top: 0, left: 0, zIndex: 99998,
    background: color, color: '#000', fontSize: '8px', fontWeight: 900,
    fontFamily: 'monospace', padding: '1px 4px', pointerEvents: 'none',
});

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
const NUM_TABS = TAB_ROUTES.length;
const PANEL_PCT = 100 / NUM_TABS;  // 33.333% — each panel's width as % of wrapper

const SNAP_THRESHOLD = 0.3;
const VELOCITY_THRESHOLD = 0.3;
const SNAP_DURATION = 280;
const SNAP_EASING = 'cubic-bezier(0.25, 1, 0.5, 1)';
const EDGE_RESISTANCE = 0.3;
const DIRECTION_LOCK_PX = 10;

function getTabIndex(pathname) {
    // ONLY match exact tab routes — sub-routes like /training, /workout/:id
    // must NOT be swallowed by the swipe system
    if (pathname === '/nutrition') return 0;
    if (pathname === '/dashboard') return 1;
    if (pathname === '/chat') return 2;
    return -1;
}

/** Convert tab index to translate3d percentage (relative to wrapper width) */
const panelOffset = (idx) => -(idx * PANEL_PCT);

const UserLayout = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const tabIndex = getTabIndex(pathname);
    const isTabRoute = tabIndex !== -1;
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
    const [visualTab, setVisualTab] = useState(tabIndex !== -1 ? tabIndex : 1);

    // Sync visualTab when route changes (from navbar tap or after swipe completes)
    useEffect(() => {
        if (tabIndex !== -1) setVisualTab(tabIndex);
    }, [tabIndex]);

    const wrapperRef = useRef(null);
    const touchState = useRef({
        startX: 0, startY: 0, startTime: 0, currentX: 0,
        locked: null, dragging: false, animating: false,
    });

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Sync wrapper position when route changes (navbar tap)
    useEffect(() => {
        if (!wrapperRef.current || !isTabRoute || !isMobile) return;
        const ts = touchState.current;
        if (ts.dragging || ts.animating) return;
        wrapperRef.current.style.transition = 'none';
        wrapperRef.current.style.transform = `translate3d(${panelOffset(tabIndex)}%, 0, 0)`;
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
        if (wrapperRef.current) wrapperRef.current.style.transition = 'none';
    }, []);

    const onTouchMove = useCallback((e) => {
        const ts = touchState.current;
        if (!ts.dragging || ts.animating) return;

        const touch = e.touches[0];
        const dx = touch.clientX - ts.startX;
        const dy = touch.clientY - ts.startY;

        if (ts.locked === null) {
            if (Math.abs(dx) > DIRECTION_LOCK_PX || Math.abs(dy) > DIRECTION_LOCK_PX) {
                ts.locked = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
            } else return;
        }
        if (ts.locked === 'v') return;

        e.preventDefault();
        let dragX = dx;
        if ((tabIndex === 0 && dx > 0) || (tabIndex === NUM_TABS - 1 && dx < 0)) {
            dragX = dx * EDGE_RESISTANCE;
        }
        ts.currentX = dragX;

        if (wrapperRef.current) {
            // Convert pixel drag to percentage of WRAPPER width
            // Wrapper = NUM_TABS * viewport, so 1px = (100 / (NUM_TABS * viewport)) %
            const wrapperWidthPx = wrapperRef.current.offsetWidth;
            const dragPct = (dragX / wrapperWidthPx) * 100;
            const base = panelOffset(tabIndex);
            wrapperRef.current.style.transform = `translate3d(${base + dragPct}%, 0, 0)`;
        }
    }, [tabIndex]);

    const onTouchEnd = useCallback(() => {
        const ts = touchState.current;
        if (!ts.dragging) return;
        ts.dragging = false;
        if (ts.locked !== 'h') return;

        const dx = ts.currentX;
        const elapsed = Date.now() - ts.startTime;
        const velocity = Math.abs(dx) / Math.max(elapsed, 1);
        const screenWidth = window.innerWidth;
        const threshold = screenWidth * SNAP_THRESHOLD;

        let targetIndex = tabIndex;
        if (dx < -threshold || (dx < 0 && velocity > VELOCITY_THRESHOLD)) {
            targetIndex = Math.min(tabIndex + 1, NUM_TABS - 1);
        } else if (dx > threshold || (dx > 0 && velocity > VELOCITY_THRESHOLD)) {
            targetIndex = Math.max(tabIndex - 1, 0);
        }

        // Update navbar icon IMMEDIATELY (before animation)
        setVisualTab(targetIndex);

        ts.animating = true;
        if (wrapperRef.current) {
            wrapperRef.current.style.transition = `transform ${SNAP_DURATION}ms ${SNAP_EASING}`;
            wrapperRef.current.style.transform = `translate3d(${panelOffset(targetIndex)}%, 0, 0)`;
        }

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
                {isMobile && <Navbar visualTab={visualTab} />}
            </div>
        );
    }

    // ── Mobile tab routes: premium swipe panels ──
    return (
         <div data-dbg="layout" style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '2px solid red',
            position: 'relative',
        }}>
            <span style={DBG_LABEL('LAYOUT', 'red')}>LAYOUT</span>
            <LayoutDebugOverlay />
            <PremiumHeader />

            {/* ═══ SWIPE CONTAINER ═══ */}
            <div
                data-dbg="swipe-ctr"
                style={{
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    touchAction: 'pan-y',
                    border: '2px solid blue',
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* ═══ PANELS WRAPPER ═══ */}
                <div
                    ref={wrapperRef}
                    style={{
                        display: 'flex',
                        width: `${NUM_TABS * 100}%`,
                        height: '100%',
                        transform: `translate3d(${panelOffset(tabIndex)}%, 0, 0)`,
                        willChange: 'transform',
                        backfaceVisibility: 'hidden',
                    }}
                >
                    {TAB_COMPONENTS.map((PageComponent, idx) => (
                        <div
                            key={TAB_NAMES[idx]}
                            data-dbg={idx === tabIndex ? 'panel-active' : `panel-${idx}`}
                            style={{
                                width: `${PANEL_PCT}%`,
                                height: '100%',
                                overflow: 'auto',
                                WebkitOverflowScrolling: 'touch',
                                overscrollBehaviorY: 'contain',
                                flexShrink: 0,
                                border: idx === tabIndex ? '2px solid cyan' : 'none',
                                position: 'relative',
                            }}
                        >
                            <Suspense fallback={
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                                    Caricamento...
                                </div>
                            }>
                                <PageErrorBoundary pageName={TAB_NAMES[idx]}>
                                    <PageComponent />
                                </PageErrorBoundary>
                            </Suspense>
                        </div>
                    ))}
                </div>
            </div>

            <div data-dbg="navbar" style={{ position: 'relative' }}>
                <span style={DBG_LABEL('NAVBAR', 'orange')}>NAVBAR</span>
                <Navbar visualTab={visualTab} />
            </div>
        </div>
    );
};

export default UserLayout;
