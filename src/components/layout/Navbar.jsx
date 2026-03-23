import { useLocation, Link } from 'react-router-dom';
import { Dumbbell, MessageCircle, Utensils } from 'lucide-react';

const Navbar = () => {
    const { pathname } = useLocation();

    let activeIndex = 1;
    if (pathname === '/nutrition' || pathname.startsWith('/nutrition')) activeIndex = 0;
    if (pathname === '/dashboard' || pathname.startsWith('/workout') || pathname.startsWith('/training')) activeIndex = 1;
    if (pathname === '/chat' || pathname.startsWith('/chat')) activeIndex = 2;

    const linkStyle = (idx) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        padding: '4px 16px',
        color: activeIndex === idx ? '#FFDCA0' : 'rgba(255,255,255,0.35)',
        textDecoration: 'none',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
    });

    const labelStyle = (idx) => ({
        fontSize: '0.58rem',
        fontWeight: activeIndex === idx ? 700 : 500,
        fontFamily: 'Outfit, sans-serif',
        letterSpacing: '0.03em',
        opacity: activeIndex === idx ? 1 : 0.8,
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
            <Link to="/nutrition" style={linkStyle(0)}>
                <Utensils size={22} strokeWidth={activeIndex === 0 ? 2.2 : 1.5} />
                <span style={labelStyle(0)}>Dieta</span>
            </Link>

            <Link to="/dashboard" style={linkStyle(1)}>
                <Dumbbell size={22} strokeWidth={activeIndex === 1 ? 2.2 : 1.5} />
                <span style={labelStyle(1)}>Allenamento</span>
            </Link>

            <Link to="/chat" style={linkStyle(2)}>
                <MessageCircle size={22} strokeWidth={activeIndex === 2 ? 2.2 : 1.5} />
                <span style={labelStyle(2)}>Chat</span>
            </Link>
        </nav>
    );
};

export default Navbar;
