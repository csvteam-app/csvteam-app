import { useEffect, useState, Component } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
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

/* ═══ TAB ROUTES for navbar highlighting ═══ */
const TAB_ROUTES = ['/nutrition', '/dashboard', '/chat'];

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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            <PremiumHeader />

            {/* ═══ PAGE CONTENT — React Router Outlet ═══ */}
            <div style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                WebkitOverflowScrolling: 'touch',
                overscrollBehaviorY: 'contain',
            }}>
                <PageErrorBoundary pageName={pathname}>
                    <Outlet />
                </PageErrorBoundary>
            </div>

            {/* ═══ NAVBAR — always visible on mobile ═══ */}
            {isMobile && <Navbar activeTab={tabIndex} />}
        </div>
    );
};

export default UserLayout;
