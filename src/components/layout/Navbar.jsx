import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [debugMsg, setDebugMsg] = useState('');
    const [tapped, setTapped] = useState('');

    const p = location.pathname;
    let activeIndex = 1;
    if (p === '/nutrition' || p.startsWith('/nutrition')) activeIndex = 0;
    else if (p === '/dashboard' || p.startsWith('/workout') || p.startsWith('/training')) activeIndex = 1;
    else if (p === '/chat' || p.startsWith('/chat')) activeIndex = 2;

    const handleTap = (label, path) => {
        setTapped(label);
        setDebugMsg('TARGET: ' + path);
        setTimeout(() => setTapped(''), 300);
        navigate(path);
    };

    const btnStyle = (idx) => ({
        background: tapped && tapped === ['DIETA_X','TRAIN_X','CHAT_X'][idx] ? '#ff0' : 'none',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        padding: '8px 20px',
        color: activeIndex === idx ? '#FFDCA0' : 'rgba(255,255,255,0.35)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        fontSize: '0.7rem',
        fontWeight: activeIndex === idx ? 700 : 500,
        fontFamily: 'Outfit, sans-serif',
        zIndex: 99999,
        position: 'relative',
    });

    return (
        <nav style={{
            flex: '0 0 auto',
            background: 'rgba(5,5,8,0.97)',
            borderTop: '2px solid #ff0',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '4px 0',
            paddingBottom: 'calc(6px + env(safe-area-inset-bottom))',
            position: 'relative',
            zIndex: 99999,
        }}>
            <button type="button" style={btnStyle(0)} onClick={() => handleTap('DIETA_X', '/nutrition')}>
                DIETA_X
            </button>

            <button type="button" style={btnStyle(1)} onClick={() => handleTap('TRAIN_X', '/dashboard')}>
                TRAIN_X
            </button>

            <button type="button" style={btnStyle(2)} onClick={() => handleTap('CHAT_X', '/chat')}>
                CHAT_X
            </button>

            {/* Debug info row */}
            <div style={{
                position: 'absolute',
                top: '-18px',
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0 8px',
                fontSize: '0.55rem',
                fontFamily: 'monospace',
                color: '#0f0',
                background: 'rgba(0,0,0,0.9)',
                lineHeight: '16px',
                pointerEvents: 'none',
                zIndex: 99999,
            }}>
                <span>NAV_BUILD_TEST_01</span>
                <span>{debugMsg || 'no tap yet'}</span>
                <span>route: {p}</span>
            </div>
        </nav>
    );
};

export default Navbar;
