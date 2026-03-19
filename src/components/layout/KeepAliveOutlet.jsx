import { useState, useEffect, useRef } from 'react';
import { useOutlet, useLocation } from 'react-router-dom';

const KEEP_ALIVE_ROUTES = ['/dashboard', '/training', '/workout', '/nutrition', '/chat', '/profile'];

const KeepAliveOutlet = () => {
    const location = useLocation();
    const outlet = useOutlet();
    const [cachedOutlets, setCachedOutlets] = useState({});
    const activePath = location.pathname;
    const prevPathRef = useRef(activePath);
    const [fadeKey, setFadeKey] = useState(0);

    const isKeepAlive = KEEP_ALIVE_ROUTES.some(r => activePath.startsWith(r));

    useEffect(() => {
        if (isKeepAlive && outlet) {
            setCachedOutlets(prev => ({ ...prev, [activePath]: outlet }));
        }
    }, [activePath, isKeepAlive, outlet]);

    // Trigger micro-fade on route change
    useEffect(() => {
        if (prevPathRef.current !== activePath) {
            setFadeKey(k => k + 1);
            prevPathRef.current = activePath;
        }
    }, [activePath]);

    return (
        <>
            {/* Render all cached outlets */}
            {Object.entries(cachedOutlets).map(([path, element]) => (
                <div
                    key={path}
                    className="keep-alive-wrapper"
                    style={{
                        display: activePath === path ? 'block' : 'none',
                        width: '100%',
                        height: '100%',
                        overflowY: 'auto',
                        overscrollBehaviorY: 'contain',
                        animation: activePath === path ? `pageFadeIn 150ms ease-out` : 'none',
                    }}
                >
                    {element}
                </div>
            ))}

            {/* Render standard outlet for non-cached routes */}
            {!isKeepAlive && (
                <div style={{
                    width: '100%', height: '100%',
                    overflowY: 'auto', overscrollBehaviorY: 'contain',
                    animation: `pageFadeIn 150ms ease-out`,
                }}>
                    {outlet}
                </div>
            )}
        </>
    );
};

export default KeepAliveOutlet;
