import { useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, MessageCircle, Utensils } from 'lucide-react';

const Navbar = ({ activeTab }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Determine which tab is active
    const getActiveIndex = () => {
        if (typeof activeTab === 'number') return activeTab;
        const p = location.pathname;
        if (p === '/nutrition' || p.startsWith('/nutrition')) return 0;
        if (p === '/dashboard' || p.startsWith('/workout') || p.startsWith('/training')) return 1;
        if (p === '/chat' || p.startsWith('/chat')) return 2;
        return 1;
    };

    const activeIndex = getActiveIndex();

    const tabStyle = (isActive) => ({
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
    });

    return (
        <nav style={{
            flex: '0 0 auto',
            background: 'rgba(5,5,8,0.97)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '6px 0 8px 0',
            paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
        }}>
            {/* Dieta */}
            <button type="button" onClick={() => navigate('/nutrition')} style={tabStyle(activeIndex === 0)}>
                <Utensils size={22} strokeWidth={activeIndex === 0 ? 2.2 : 1.5} />
                <span style={{ fontSize: '0.58rem', fontWeight: activeIndex === 0 ? 700 : 500, fontFamily: 'Outfit' }}>
                    Dieta
                </span>
            </button>

            {/* Allenamento */}
            <button data-debug="allenamento-v2" type="button" onClick={() => { console.log('NAV: Allenamento clicked'); navigate('/dashboard'); }} style={tabStyle(activeIndex === 1)}>
                <span style={{ fontSize: '22px' }}>🏋️</span>
                <span style={{ fontSize: '0.58rem', fontWeight: activeIndex === 1 ? 700 : 500, fontFamily: 'Outfit' }}>
                    Allenamento
                </span>
            </button>

            {/* Chat */}
            <button type="button" onClick={() => navigate('/chat')} style={tabStyle(activeIndex === 2)}>
                <MessageCircle size={22} strokeWidth={activeIndex === 2 ? 2.2 : 1.5} />
                <span style={{ fontSize: '0.58rem', fontWeight: activeIndex === 2 ? 700 : 500, fontFamily: 'Outfit' }}>
                    Chat
                </span>
            </button>
        </nav>
    );
};

export default Navbar;
