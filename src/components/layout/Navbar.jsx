import { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [log, setLog] = useState([]);
    const logRef = useRef([]);

    const addLog = (msg) => {
        const entry = new Date().toLocaleTimeString() + ' ' + msg;
        logRef.current = [...logRef.current.slice(-8), entry];
        setLog([...logRef.current]);
    };

    const p = location.pathname;
    let activeIndex = 1;
    if (p === '/nutrition' || p.startsWith('/nutrition')) activeIndex = 0;
    if (p === '/dashboard' || p.startsWith('/workout') || p.startsWith('/training')) activeIndex = 1;
    if (p === '/chat' || p.startsWith('/chat')) activeIndex = 2;

    const handleTap = (label, path) => {
        addLog('TAP_OK: ' + label);
        try {
            navigate(path);
            addLog('NAVIGATE_OK: ' + path);
        } catch (err) {
            addLog('NAVIGATE_ERR: ' + err.message);
        }
    };

    // Log route changes
    const lastRoute = useRef(p);
    if (p !== lastRoute.current) {
        const msg = 'ROUTE_CHANGED: ' + lastRoute.current + ' → ' + p;
        lastRoute.current = p;
        // Push into ref directly (avoid setState during render)
        logRef.current = [...logRef.current.slice(-8), new Date().toLocaleTimeString() + ' ' + msg];
    }

    const btnStyle = (idx) => ({
        background: 'none',
        border: activeIndex === idx ? '2px solid #ff0' : '2px solid #555',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        padding: '8px 20px',
        color: activeIndex === idx ? '#FFDCA0' : 'rgba(255,255,255,0.5)',
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation',
        fontSize: '0.72rem',
        fontWeight: 700,
        fontFamily: 'Outfit, sans-serif',
        zIndex: 99999,
        position: 'relative',
        borderRadius: '8px',
    });

    return (
        <div style={{ flex: '0 0 auto', zIndex: 99999, position: 'relative' }}>
            {/* Debug log panel */}
            <div style={{
                background: '#000',
                padding: '4px 8px',
                fontSize: '0.55rem',
                fontFamily: 'monospace',
                color: '#0f0',
                maxHeight: '80px',
                overflow: 'auto',
                borderTop: '1px solid #0f0',
            }}>
                <div style={{ color: '#ff0', marginBottom: '2px' }}>
                    NAV_BUILD_TEST_02 | route: {p} | active: {activeIndex}
                </div>
                {log.length === 0
                    ? <div style={{ color: '#666' }}>tap a button to see events...</div>
                    : log.map((entry, i) => <div key={i}>{entry}</div>)
                }
            </div>

            {/* Navbar buttons */}
            <nav style={{
                background: 'rgba(5,5,8,0.97)',
                borderTop: '2px solid #ff0',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                padding: '6px 0',
                paddingBottom: 'calc(6px + env(safe-area-inset-bottom))',
                zIndex: 99999,
                position: 'relative',
            }}>
                <button type="button" style={btnStyle(0)} onClick={() => handleTap('DIETA', '/nutrition')}>
                    DIETA_X
                </button>

                <button type="button" style={btnStyle(1)} onClick={() => handleTap('TRAIN', '/dashboard')}>
                    TRAIN_X
                </button>

                <button type="button" style={btnStyle(2)} onClick={() => handleTap('CHAT', '/chat')}>
                    CHAT_X
                </button>
            </nav>
        </div>
    );
};

export default Navbar;
