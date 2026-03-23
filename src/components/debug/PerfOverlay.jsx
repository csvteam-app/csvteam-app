/**
 * PerfOverlay — Real-time performance debug overlay for PWA iPhone profiling.
 * Toggle: triple-tap top-right corner, or ?perf=1 in URL.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { perfGetState } from './perfTracker';

// Build-time stamps injected by Vite define
const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 'dev';
const BUILD_ID = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'local';

export default function PerfOverlay() {
    const location = useLocation();
    const [visible, setVisible] = useState(true);
    const [tick, setTick] = useState(0);
    const tapCount = useRef(0);
    const tapTimer = useRef(null);
    const [expanded, setExpanded] = useState(false);

    // Triple-tap to toggle
    const handleTap = useCallback(() => {
        tapCount.current++;
        clearTimeout(tapTimer.current);
        tapTimer.current = setTimeout(() => {
            if (tapCount.current >= 3) {
                setVisible(v => !v);
            }
            tapCount.current = 0;
        }, 400);
    }, []);

    // Refresh ticker every 500ms when visible
    useEffect(() => {
        if (!visible) return;
        const id = setInterval(() => setTick(t => t + 1), 500);
        return () => clearInterval(id);
    }, [visible]);

    // Track page switches
    useEffect(() => {
        const _perf = perfGetState();
        _perf.lastPageSwitch = performance.now();
        _perf.pageSwitchCount++;
    }, [location.pathname]);

    // Service worker status
    const [swStatus, setSwStatus] = useState('...');
    useEffect(() => {
        if (!('serviceWorker' in navigator)) { setSwStatus('N/A'); return; }
        navigator.serviceWorker.getRegistration().then(reg => {
            if (!reg) { setSwStatus('none'); return; }
            if (reg.waiting) setSwStatus('⚠️ WAITING');
            else if (reg.active) setSwStatus('active');
            else if (reg.installing) setSwStatus('installing');
            else setSwStatus('?');
        }).catch(() => setSwStatus('err'));
    }, [tick]);

    // Tap zone (top-right corner — always rendered)
    const tapZone = (
        <div
            onClick={handleTap}
            style={{
                position: 'fixed', top: 0, right: 0,
                width: '60px', height: '60px',
                zIndex: 99999, background: 'transparent',
            }}
        />
    );

    if (!visible) return tapZone;

    const _perf = perfGetState();
    const now = performance.now();
    const timeSinceSwitch = Math.round(now - _perf.lastPageSwitch);
    const recentFetches = _perf.fetchLog.slice(-10);
    const pageRenders = Object.entries(_perf.renderCounts);
    const pageMounts = Object.entries(_perf.mountTimes).map(([name, t]) => ({
        name,
        mountedAgo: Math.round(now - t),
        mountCount: _perf.tabMounts[name] || 1,
    }));

    return (
        <>
            {tapZone}
            <div
                onClick={() => setExpanded(e => !e)}
                style={{
                    position: 'fixed',
                    bottom: expanded ? '0' : 'auto',
                    top: expanded ? 'auto' : '0',
                    left: '0', right: '0',
                    zIndex: 99998,
                    background: 'rgba(0,0,0,0.93)',
                    color: '#0f0',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                    lineHeight: '14px',
                    padding: '6px 8px',
                    paddingTop: expanded ? '6px' : 'max(env(safe-area-inset-top, 0px), 6px)',
                    maxHeight: expanded ? '65vh' : '105px',
                    overflow: 'auto',
                    borderBottom: expanded ? 'none' : '2px solid #0f0',
                    borderTop: expanded ? '2px solid #0f0' : 'none',
                    WebkitOverflowScrolling: 'touch',
                    touchAction: 'pan-y',
                }}
            >
                {/* HEADER */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #0a0', paddingBottom: '2px', marginBottom: '3px' }}>
                    <span>📍 {location.pathname}</span>
                    <span>SW: {swStatus}</span>
                </div>

                {/* METRICS */}
                <div>⏱ switch {timeSinceSwitch}ms ago | 📡 {_perf.fetchCount} fetch ({_perf.activeFetches} active) | 🔄 page×{_perf.pageSwitchCount}</div>
                <div style={{ color: '#ff0' }}>🏗 {BUILD_TIME} [{BUILD_ID}]</div>

                {/* EXPANDED */}
                {expanded && (
                    <>
                        <div style={{ borderTop: '1px solid #0a0', marginTop: '4px', paddingTop: '4px' }}>
                            <div style={{ color: '#0ff', fontWeight: 'bold' }}>── COMPONENT MOUNTS ──</div>
                            {pageMounts.length === 0 && <div>No mounts tracked yet</div>}
                            {pageMounts.map(m => (
                                <div key={m.name}>
                                    {m.name}: {m.mountedAgo}ms ago
                                    {m.mountCount > 1
                                        ? <span style={{ color: '#f00' }}> REMOUNTED ×{m.mountCount}</span>
                                        : <span> ×1</span>}
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px solid #0a0', marginTop: '4px', paddingTop: '4px' }}>
                            <div style={{ color: '#0ff', fontWeight: 'bold' }}>── RENDER COUNTS ──</div>
                            {pageRenders.length === 0 && <div>No renders tracked yet</div>}
                            {pageRenders.map(([name, count]) => (
                                <div key={name}>
                                    {name}: <span style={{ color: count > 10 ? '#f00' : count > 4 ? '#ff0' : '#0f0' }}>{count}×</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: '1px solid #0a0', marginTop: '4px', paddingTop: '4px' }}>
                            <div style={{ color: '#0ff', fontWeight: 'bold' }}>── FETCH LOG (last 10) ──</div>
                            {recentFetches.length === 0 && <div>No fetches yet</div>}
                            {recentFetches.map((f, i) => (
                                <div key={i} style={{ color: f.error ? '#f00' : (f.durationMs > 500 ? '#ff0' : '#0f0') }}>
                                    {f.durationMs != null ? `${f.durationMs}ms` : '⏳'} {f.url}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div style={{ color: '#666', marginTop: '2px', fontSize: '9px' }}>
                    {expanded ? '↑ tap to collapse' : '↓ tap to expand · 3×tap top-right to hide'}
                </div>
            </div>
        </>
    );
}
