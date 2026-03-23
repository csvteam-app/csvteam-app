import { useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, MessageCircle, Utensils } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

const Navbar = ({ activeTab }) => {
    const location = useLocation();
    const navigate = useNavigate();

    const [lastTrainingPath, setLastTrainingPath] = useState('/dashboard');

    useEffect(() => {
        if (location.pathname === '/dashboard' || location.pathname.startsWith('/workout') || location.pathname.startsWith('/training')) {
            setLastTrainingPath(location.pathname);
        }
    }, [location.pathname]);

    const navItems = [
        { name: 'Dieta', path: '/nutrition', icon: Utensils, isTrainingEcosystem: false },
        { name: 'Allenamento', path: '/dashboard', icon: Dumbbell, isTrainingEcosystem: true },
        { name: 'Chat', path: '/chat', icon: MessageCircle, isTrainingEcosystem: false },
    ];

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
        return 1;
    };

    const activeIndex = getActiveIndex();

    return (
        <nav
            className="lg-hidden"
            style={{
                flex: '0 0 auto',
                background: 'rgba(5,5,8,0.97)',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                padding: '6px 0 8px 0',
            }}
        >
            {navItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = idx === activeIndex;

                const handleNavClick = (e) => {
                    e.preventDefault();

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
                            border: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                            padding: '4px 16px',
                            color: isActive ? '#FFDCA0' : 'rgba(255,255,255,0.35)',
                            cursor: 'pointer',
                            WebkitTapHighlightColor: 'transparent',
                            touchAction: 'manipulation',
                            position: 'relative',
                        }}
                    >
                        <Icon
                            size={22}
                            strokeWidth={isActive ? 2.2 : 1.5}
                        />
                        <span style={{
                            fontSize: '0.58rem',
                            fontWeight: isActive ? 700 : 500,
                            fontFamily: 'Outfit',
                            letterSpacing: '0.03em',
                            opacity: isActive ? 1 : 0.8,
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
