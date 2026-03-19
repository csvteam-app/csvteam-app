import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, MessageCircle, Dumbbell, Utensils, User } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

const Navbar = ({ activeTab }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const navRef = useRef(null);

    // Store the last active path for the "Allenamento" ecosystem
    const [lastTrainingPath, setLastTrainingPath] = useState('/dashboard');
    const [tappedIdx, setTappedIdx] = useState(null);

    useEffect(() => {
        if (location.pathname === '/dashboard' || location.pathname.startsWith('/workout') || location.pathname.startsWith('/training')) {
            setLastTrainingPath(location.pathname);
        }
    }, [location.pathname]);

    const navItems = [
        { name: 'Shop', path: '/shop', icon: ShoppingBag, isTrainingEcosystem: false },
        { name: 'Chat', path: '/chat', icon: MessageCircle, isTrainingEcosystem: false },
        { name: 'Allenamento', path: '/dashboard', icon: Dumbbell, isTrainingEcosystem: true },
        { name: 'Dieta', path: '/nutrition', icon: Utensils, isTrainingEcosystem: false },
        { name: 'Profilo', path: '/profile', icon: User, isTrainingEcosystem: false },
    ];

    // Use activeTab prop if provided (real-time from carousel), else use pathname
    const getActiveIndex = () => {
        if (typeof activeTab === 'number') return activeTab;
        for (let i = 0; i < navItems.length; i++) {
            const item = navItems[i];
            if (item.isTrainingEcosystem) {
                if (location.pathname === '/dashboard' || location.pathname.startsWith('/workout') || location.pathname.startsWith('/training')) return i;
            } else if (item.path !== '/' && location.pathname.startsWith(item.path)) {
                return i;
            }
        }
        return 2;
    };

    const activeIndex = getActiveIndex();
    const isChatActive = activeIndex === 1;

    return (
        <nav
            ref={navRef}
            className="lg-hidden"
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                width: '100%',
                background: 'rgba(5,5,8,0.92)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                padding: '6px 0 0 0',
                paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
                zIndex: 9999,
                transform: isChatActive ? 'translateY(100%)' : 'translateY(0)',
                opacity: isChatActive ? 0 : 1,
                pointerEvents: isChatActive ? 'none' : 'auto',
                transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
        >
            {navItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = idx === activeIndex;

                const handleNavClick = (e) => {
                    e.preventDefault();

                    // Micro-bounce on tap
                    setTappedIdx(idx);
                    setTimeout(() => setTappedIdx(null), 200);

                    if (item.isTrainingEcosystem && !isActive) {
                        navigate(lastTrainingPath);
                    } else if (item.isTrainingEcosystem && isActive) {
                        navigate('/dashboard');
                    } else {
                        navigate(item.path);
                    }
                };

                return (
                    <button
                        key={item.name}
                        onClick={handleNavClick}
                        style={{
                            background: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '4px 16px',
                            color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
                            cursor: 'pointer',
                            transition: 'all 0.25s ease',
                            transform: tappedIdx === idx ? 'scale(0.85)' : 'scale(1)',
                            WebkitTapHighlightColor: 'transparent',
                            position: 'relative',
                        }}
                    >
                        <Icon
                            size={22}
                            strokeWidth={isActive ? 2.2 : 1.5}
                            style={{
                                filter: isActive ? 'drop-shadow(0px 0px 6px rgba(212,175,55,0.8)) drop-shadow(0px 0px 12px rgba(212,175,55,0.6))' : 'none',
                                transition: 'filter 0.3s ease'
                            }}
                        />
                        <span style={{
                            fontSize: '0.58rem',
                            fontWeight: isActive ? 700 : 500,
                            fontFamily: 'Outfit',
                            letterSpacing: '0.03em',
                            opacity: isActive ? 1 : 0.8,
                            textShadow: isActive ? '0px 0px 8px rgba(212,175,55,0.9), 0px 0px 16px rgba(212,175,55,0.6)' : 'none',
                            transition: 'text-shadow 0.3s ease'
                        }}>
                            {item.name}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
};

export default Navbar;
