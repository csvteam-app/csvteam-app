import { useEffect, useState, Component } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import PremiumHeader from './PremiumHeader';
import Navbar from './Navbar';

/* ═══ TAB PAGES — order: Dieta, Allenamento, Chat ═══ */
const TAB_ROUTES = ['/nutrition', '/dashboard', '/chat'];

/* Direct imports for tab rendering */
import Nutrition from '../../pages/user/Nutrition';
import Dashboard from '../../pages/user/Dashboard';
import Chat from '../../pages/user/Chat';

const TAB_COMPONENTS = [Nutrition, Dashboard, Chat];

/* ═══ Per-page Error Boundary — prevents one crash from killing the app ═══ */
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

function getTabIndex(pathname) {
    const exact = TAB_ROUTES.indexOf(pathname);
    if (exact !== -1) return exact;
    if (pathname.startsWith('/chat')) return 2;
    if (pathname.startsWith('/workout') || pathname.startsWith('/training')) return 1;
    return -1;
}

const UserLayout = () => {
    const { pathname } = useLocation();
    const tabIndex = getTabIndex(pathname);
    const isTabRoute = tabIndex !== -1;
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ── Non-tab routes OR Desktop mode: render with Outlet ──
    if (!isTabRoute || !isMobile) {
        const hideNav = pathname.startsWith('/chat');
        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                {!hideNav && <PremiumHeader />}
                <div style={{
                    flex: 1, 
                    overflowY: 'hidden',
                    overscrollBehaviorY: 'contain',
                    WebkitOverflowScrolling: 'touch',
                    paddingTop: !hideNav && !isMobile ? '60px' : '0',
                }}>
                    <PageErrorBoundary pageName="outlet">
                        <Outlet />
                    </PageErrorBoundary>
                </div>
                {(!hideNav && isMobile) && <Navbar />}
            </div>
        );
    }

    // ── Tab routes on mobile: simple tab rendering (no carousel/swipe) ──
    // All tabs kept mounted (preserves state), only active one is displayed.
    return (
        <div style={{
            height: '100%', maxHeight: '100%',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
            <PremiumHeader />

            {/* ═══ TAB PAGES — display: none/flex toggles visibility ═══ */}
            {TAB_ROUTES.map((route, idx) => {
                const PageComponent = TAB_COMPONENTS[idx];
                const isActive = idx === tabIndex;

                return (
                    <div
                        key={route}
                        style={{
                            display: isActive ? 'flex' : 'none',
                            flexDirection: 'column',
                            flex: 1,
                            minHeight: 0,
                            overflow: 'auto',
                            WebkitOverflowScrolling: 'touch',
                            overscrollBehaviorY: 'contain',
                        }}
                    >
                        <PageErrorBoundary pageName={route}>
                            <PageComponent />
                        </PageErrorBoundary>
                    </div>
                );
            })}

            {/* Navbar — always visible on all tabs */}
            <Navbar activeTab={tabIndex} />
        </div>
    );
};

export default UserLayout;
