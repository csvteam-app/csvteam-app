import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Users, FileText, LogOut, Database, CalendarDays, MessageSquare, Eye } from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { useAuth } from '../../context/AuthContext';
import CsvLogo from '../ui/CsvLogo';

/* ═══ TAB PAGES — order matches bottom navbar ═══ */
const TAB_ROUTES = ['/admin/dashboard', '/admin/chat', '/admin/lessons', '/admin/programs', '/admin/exercises'];

/* Direct imports for carousel (no lazy — keeps them alive when swiping) */
import AdminDashboard from '../../pages/admin/AdminDashboard';
import AdminChat from '../../pages/admin/AdminChat';
import AdminLessons from '../../pages/admin/AdminLessons';
import ProgramBuilder from '../../pages/admin/ProgramBuilder';
import ExerciseLibrary from '../../pages/admin/ExerciseLibrary';

const TAB_COMPONENTS = [AdminDashboard, AdminChat, AdminLessons, ProgramBuilder, ExerciseLibrary];

const TAB_ICONS = [
    { icon: <Users size={18} strokeWidth={1.5} />, label: 'Atleti' },
    { icon: <MessageSquare size={18} strokeWidth={1.5} />, label: 'Chat' },
    { icon: <CalendarDays size={18} strokeWidth={1.5} />, label: 'Lezioni' },
    { icon: <FileText size={18} strokeWidth={1.5} />, label: 'Programmi' },
    { icon: <Database size={18} strokeWidth={1.5} />, label: 'Esercizi' },
];

function getTabIndex(pathname) {
    const exact = TAB_ROUTES.indexOf(pathname);
    if (exact !== -1) return exact;
    // Sub-routes: /admin/programs/:id → programs tab
    if (pathname.startsWith('/admin/programs')) return 3;
    if (pathname.startsWith('/admin/chat')) return 1;
    return -1;
}

const AdminLayout = () => {
    const { logout, admin } = useAdminAuth();
    const { isAuthenticated: hasSupabaseSession, role } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const scrollRef = useRef(null);
    const isProgrammatic = useRef(false);
    const scrollTimeout = useRef(null);
    const didMount = useRef(false);
    const lastSyncedTab = useRef(-1);

    const canViewAsAthlete = hasSupabaseSession && ['coach', 'superadmin'].includes(role);

    const tabIndex = getTabIndex(location.pathname);
    const isTabRoute = tabIndex !== -1;
    const [visualTab, setVisualTab] = useState(tabIndex >= 0 ? tabIndex : 0);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reset didMount when leaving carousel
    useEffect(() => {
        if (!isTabRoute) { didMount.current = false; }
    }, [isTabRoute]);

    // Set initial scroll position BEFORE first paint
    useEffect(() => {
        if (!isTabRoute || !scrollRef.current || didMount.current) return;
        const container = scrollRef.current;
        if (container.clientWidth === 0) return;
        container.scrollLeft = tabIndex * container.clientWidth;
        lastSyncedTab.current = tabIndex;
        setVisualTab(tabIndex);
        didMount.current = true;
    });

    // Scroll to correct page on route change (navbar tap)
    useEffect(() => {
        if (!isTabRoute || !scrollRef.current || !didMount.current) return;
        const container = scrollRef.current;
        const pageWidth = container.clientWidth;
        if (pageWidth === 0) return;

        const targetScroll = tabIndex * pageWidth;
        const currentPage = Math.round(container.scrollLeft / pageWidth);

        if (currentPage !== tabIndex || lastSyncedTab.current !== tabIndex) {
            isProgrammatic.current = true;
            container.scrollTo({ left: targetScroll, behavior: 'smooth' });
            lastSyncedTab.current = tabIndex;

            const resetFlag = () => { isProgrammatic.current = false; };
            if ('onscrollend' in window) {
                container.addEventListener('scrollend', resetFlag, { once: true });
            } else {
                setTimeout(resetFlag, 400);
            }
        }
    }, [tabIndex, isTabRoute]);

    // Detect scroll-snap settle → sync route
    const handleScrollEnd = useCallback(() => {
        if (isProgrammatic.current || !scrollRef.current) return;
        const container = scrollRef.current;
        const pageWidth = container.clientWidth;
        if (pageWidth === 0) return;

        const currentPage = Math.round(container.scrollLeft / pageWidth);
        const clampedPage = Math.max(0, Math.min(currentPage, TAB_ROUTES.length - 1));

        if (clampedPage !== tabIndex) {
            lastSyncedTab.current = clampedPage;
            isProgrammatic.current = true;
            navigate(TAB_ROUTES[clampedPage], { replace: true });
            requestAnimationFrame(() => { isProgrammatic.current = false; });
        }
    }, [tabIndex, navigate]);

    // Scroll listener: real-time visual tab + debounced route sync
    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        const pageWidth = container.clientWidth;
        if (pageWidth === 0) return;

        const currentPage = Math.round(container.scrollLeft / pageWidth);
        const clamped = Math.max(0, Math.min(currentPage, TAB_ROUTES.length - 1));
        setVisualTab(clamped);

        if (isProgrammatic.current) return;
        clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(handleScrollEnd, 50);
    }, [handleScrollEnd]);

    const handleLogout = () => {
        logout();
        navigate('/admin/login');
    };

    // ── Non-tab routes (e.g. /admin/athlete/:id) OR Desktop: render with Outlet ──
    if (!isTabRoute || !isMobile) {
        const isChat = location.pathname.includes('/admin/chat');

        return (
            <div className="admin-container" style={{ display: 'flex', height: '100dvh', overflow: 'hidden' }}>
                {/* Desktop Sidebar */}
                <aside className="admin-sidebar" style={{
                    width: '260px', background: 'rgba(255,255,255,0.02)',
                    backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    borderRight: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0,
                }}>
                    <div className="sidebar-header" style={{ padding: '28px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="flex-row gap-3 items-center">
                            <CsvLogo size={30} showText={false} />
                            <div>
                                <h1 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', lineHeight: 1.2 }}>
                                    <span style={{ color: 'var(--accent-gold)' }}>CSV</span> Coach
                                </h1>
                                <p className="text-small" style={{ fontSize: '0.68rem', opacity: 0.5 }}>{admin?.email || 'Sistema di Gestione'}</p>
                            </div>
                        </div>
                    </div>

                    <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                        {TAB_ROUTES.map((path, idx) => (
                            <a
                                key={path}
                                onClick={() => navigate(path)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '12px 14px', borderRadius: '12px', cursor: 'pointer',
                                    color: location.pathname === path ? '#050508' : 'var(--text-muted)',
                                    background: location.pathname === path ? 'var(--gradient-primary)' : 'transparent',
                                    transition: 'all 0.25s ease-out',
                                    fontWeight: location.pathname === path ? 700 : 400,
                                    fontSize: '0.85rem', fontFamily: 'Outfit, sans-serif',
                                }}
                            >
                                {TAB_ICONS[idx].icon}
                                <span>{TAB_ICONS[idx].label}</span>
                            </a>
                        ))}
                    </nav>

                    <div className="sidebar-footer" style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {canViewAsAthlete && (
                            <button onClick={() => navigate('/dashboard')} className="flex-row gap-2 items-center" style={{
                                color: 'var(--accent-teal, #2dd4bf)', width: '100%', padding: '12px 14px',
                                fontSize: '0.82rem', background: 'rgba(45,212,191,0.04)', border: '1px solid rgba(45,212,191,0.12)',
                                borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontFamily: 'Outfit, sans-serif',
                            }}>
                                <Eye size={16} strokeWidth={1.5} /><span>Vista Atleta</span>
                            </button>
                        )}
                        <button onClick={handleLogout} className="flex-row gap-2 items-center" style={{
                            color: '#ff6b6b', width: '100%', padding: '12px 14px',
                            fontSize: '0.82rem', background: 'rgba(255,107,107,0.04)', border: '1px solid rgba(255,107,107,0.08)',
                            borderRadius: '12px', cursor: 'pointer', fontWeight: 600, fontFamily: 'Outfit, sans-serif',
                        }}>
                            <LogOut size={16} strokeWidth={1.5} /><span>Esci dal Portale</span>
                        </button>
                    </div>
                </aside>

                <main className="admin-main" style={{
                    flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
                    backgroundColor: 'var(--bg-color)', padding: isChat ? '0' : '32px',
                }}>
                    <Outlet />
                </main>
            </div>
        );
    }

    // ── MOBILE: Swipe Carousel (same as athlete version) ──
    return (
        <div style={{
            height: '100dvh', maxHeight: '100dvh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
            {/* ═══ SWIPEABLE PAGES CAROUSEL ═══ */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="swipe-carousel"
                style={{
                    flex: 1,
                    display: 'flex',
                    overflowX: 'scroll',
                    overflowY: 'hidden',
                    scrollSnapType: 'x mandatory',
                    WebkitOverflowScrolling: 'touch',
                    overscrollBehaviorX: 'contain',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    touchAction: 'pan-x',
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                }}
            >
                {TAB_ROUTES.map((route, idx) => {
                    const PageComponent = TAB_COMPONENTS[idx];
                    const isChat = idx === 1; // AdminChat

                    return (
                        <div
                            key={route}
                            className="swipe-page"
                            style={{
                                flex: '0 0 100%',
                                width: '100%',
                                height: '100%',
                                overflowY: 'auto',
                                overscrollBehaviorY: 'contain',
                                WebkitOverflowScrolling: 'touch',
                                scrollSnapAlign: 'center',
                                scrollSnapStop: 'always',
                                contain: 'layout style',
                                padding: isChat ? '0' : '16px',
                                paddingBottom: isChat ? '0' : 'calc(80px + env(safe-area-inset-bottom))',
                            }}
                        >
                            <PageComponent />
                        </div>
                    );
                })}
            </div>

            {/* ═══ BOTTOM NAVBAR ═══ */}
            <div
                className="admin-bottom-nav"
                style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
                    height: 'calc(60px + env(safe-area-inset-bottom))',
                    paddingBottom: 'env(safe-area-inset-bottom)',
                    background: 'rgba(5, 5, 8, 0.92)',
                    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                    borderTop: '1px solid var(--glass-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-around',
                }}
            >
                {TAB_ICONS.map((tab, idx) => (
                    <button
                        key={idx}
                        onClick={() => navigate(TAB_ROUTES[idx])}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '8px 12px', minWidth: '48px',
                            color: visualTab === idx ? 'var(--accent-gold)' : 'var(--text-muted)',
                            transition: 'color 0.2s',
                        }}
                    >
                        {tab.icon}
                        <span style={{
                            fontSize: '0.6rem', fontFamily: 'Outfit', fontWeight: visualTab === idx ? 700 : 500,
                            color: visualTab === idx ? 'var(--accent-gold)' : 'var(--text-muted)',
                        }}>
                            {tab.label}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AdminLayout;
