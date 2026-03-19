import { useEffect, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import PremiumHeader from './PremiumHeader';
import Navbar from './Navbar';

/* ═══ TAB PAGES — order matches navbar ═══ */
const TAB_ROUTES = ['/shop', '/chat', '/dashboard', '/nutrition', '/profile'];

/* Direct imports for carousel rendering */
import Shop from '../../pages/user/Shop';
import Chat from '../../pages/user/Chat';
import Dashboard from '../../pages/user/Dashboard';
import Nutrition from '../../pages/user/Nutrition';
import Profile from '../../pages/user/Profile';

const TAB_COMPONENTS = [Shop, Chat, Dashboard, Nutrition, Profile];

function getTabIndex(pathname) {
    const exact = TAB_ROUTES.indexOf(pathname);
    if (exact !== -1) return exact;
    if (pathname.startsWith('/chat')) return 1;
    return -1;
}

const UserLayout = () => {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const scrollRef = useRef(null);
    const isProgrammatic = useRef(false);
    const scrollTimeout = useRef(null);
    const didMount = useRef(false);
    const lastSyncedTab = useRef(-1);

    const tabIndex = getTabIndex(pathname);
    const isTabRoute = tabIndex !== -1;
    const [visualTab, setVisualTab] = useState(tabIndex >= 0 ? tabIndex : 2);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Reset didMount when leaving carousel so re-entry syncs correctly
    useEffect(() => {
        if (!isTabRoute) {
            didMount.current = false;
        }
    }, [isTabRoute]);

    // ── Set initial scroll position BEFORE first paint ──
    useEffect(() => {
        if (!isTabRoute || !scrollRef.current || didMount.current) return;
        const container = scrollRef.current;
        if (container.clientWidth === 0) return; // not yet laid out
        container.scrollLeft = tabIndex * container.clientWidth;
        lastSyncedTab.current = tabIndex;
        setVisualTab(tabIndex);
        didMount.current = true;
    });

    // ── Scroll to correct page on route change (navbar tap) ──
    useEffect(() => {
        if (!isTabRoute || !scrollRef.current || !didMount.current) return;

        const container = scrollRef.current;
        const pageWidth = container.clientWidth;
        if (pageWidth === 0) return;

        const targetScroll = tabIndex * pageWidth;
        const currentPage = Math.round(container.scrollLeft / pageWidth);

        // Sync if tabIndex changed OR if scroll position doesn't match
        if (currentPage !== tabIndex || lastSyncedTab.current !== tabIndex) {
            isProgrammatic.current = true;
            container.scrollTo({ left: targetScroll, behavior: 'smooth' });
            lastSyncedTab.current = tabIndex;

            // Use the transitionend / scrollend to reset the flag
            const resetFlag = () => { isProgrammatic.current = false; };

            // Modern browsers support scrollend
            if ('onscrollend' in window) {
                container.addEventListener('scrollend', resetFlag, { once: true });
            } else {
                setTimeout(resetFlag, 400);
            }
        }
    }, [tabIndex, isTabRoute]);

    // ── Detect scroll-snap settle → sync route ──
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
            // Reset after React processes the navigation
            requestAnimationFrame(() => {
                isProgrammatic.current = false;
            });
        }
    }, [tabIndex, navigate]);

    // ── Scroll listener: real-time visual tab + debounced route sync ──
    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const container = scrollRef.current;
        const pageWidth = container.clientWidth;
        if (pageWidth === 0) return;

        // Real-time visual update (no debounce)
        const currentPage = Math.round(container.scrollLeft / pageWidth);
        const clamped = Math.max(0, Math.min(currentPage, TAB_ROUTES.length - 1));
        setVisualTab(clamped);

        // Debounced route sync
        if (isProgrammatic.current) return;
        clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(handleScrollEnd, 50);
    }, [handleScrollEnd]);

    // ── Non-tab routes OR Desktop mode: render with Outlet ──
    if (!isTabRoute || !isMobile) {
        const hideNav = pathname.startsWith('/chat');
        return (
            <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {!hideNav && <PremiumHeader />}
                <div style={{
                    flex: 1, 
                    overflowY: hideNav ? 'hidden' : 'auto',
                    overscrollBehaviorY: 'contain',
                    WebkitOverflowScrolling: 'touch',
                    paddingTop: !hideNav && !isMobile ? '60px' : '0', // Offset for PremiumHeader on desktop
                    paddingBottom: hideNav || !isMobile ? '0' : 'calc(20px + env(safe-area-inset-bottom))',
                }}>
                    <Outlet />
                </div>
                {(!hideNav && isMobile) && <Navbar />}
            </div>
        );
    }

    // ── Tab routes: render carousel ──
    // IMPORTANT: PremiumHeader and Navbar must ALWAYS be rendered in carousel
    // to keep container height stable. Changing height desynchronizes scroll-snap.

    return (
        <div style={{
            height: '100dvh', maxHeight: '100dvh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
            <PremiumHeader />

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
                    /* GPU layer promotion */
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                }}
            >
                {TAB_ROUTES.map((route, idx) => {
                    const Component = TAB_COMPONENTS[idx];

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
                                /* Isolate layout recalculations */
                                contain: 'layout style',
                            }}
                        >
                            <Component />
                        </div>
                    );
                })}
            </div>

            <Navbar activeTab={visualTab} />
        </div>
    );
};

export default UserLayout;
