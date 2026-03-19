import React, { useState, useEffect, useCallback } from 'react';
import { PlayCircle } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   GLOBAL VIDEO LOADING QUEUE
   iOS Safari limits concurrent video connections to ~4-6.
   This queue ensures we only set the src on MAX_CONCURRENT
   videos at a time. When one finishes loading its preview
   frame, the next in the queue gets its src set.
   ═══════════════════════════════════════════════════════════════ */
const MAX_CONCURRENT = 4;
let activeCount = 0;
const waitingQueue = [];

function enqueue(startFn) {
    if (activeCount < MAX_CONCURRENT) {
        activeCount++;
        startFn();
    } else {
        waitingQueue.push(startFn);
    }
}

function dequeue() {
    activeCount = Math.max(0, activeCount - 1);
    if (waitingQueue.length > 0 && activeCount < MAX_CONCURRENT) {
        activeCount++;
        const next = waitingQueue.shift();
        next();
    }
}

/* ═══════════════════════════════════════════════════════════════ */

const LazyVideo = ({ src, title, onClick }) => {
    const [activeSrc, setActiveSrc] = useState(null);
    const [showSpinner, setShowSpinner] = useState(true);
    const releasedRef = React.useRef(false);

    const release = useCallback(() => {
        if (!releasedRef.current) {
            releasedRef.current = true;
            dequeue();
        }
    }, []);

    useEffect(() => {
        enqueue(() => setActiveSrc(src));
        return () => release();
    }, [src, release]);

    // Called once the browser has at least metadata/first frame ready
    const handleReady = () => {
        setShowSpinner(false);
        release();
    };

    return (
        <div
            style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%',
                backgroundColor: '#0a0a0f',
                overflow: 'hidden'
            }}
            onClick={onClick}
        >
            {/* The <video> is ALWAYS visible — no opacity tricks.
                On mobile it will render its frame naturally once data arrives. */}
            {activeSrc && (
                <video
                    src={activeSrc}
                    preload="metadata"
                    muted
                    playsInline
                    onLoadedMetadata={handleReady}
                    onLoadedData={handleReady}
                    onSeeked={handleReady}
                    onError={handleReady}
                    style={{
                        position: 'absolute', inset: 0,
                        width: '100%', height: '100%',
                        objectFit: 'cover',
                    }}
                />
            )}

            {/* Spinner — only visible while the video is queued or still loading */}
            {showSpinner && (
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(135deg, rgba(15,15,20,0.95), rgba(8,8,12,1))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1
                }}>
                    <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'var(--accent-gold)' }} />
                </div>
            )}

            {/* Play icon overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(0,0,0,0.15) 0%, rgba(13,17,23,0.5) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none', zIndex: 2
            }}>
                <PlayCircle size={36} color="var(--accent-gold)" style={{ opacity: 0.9, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }} />
            </div>

            {/* Title bar */}
            {title && (
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    padding: '14px 10px 10px 10px',
                    background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
                    pointerEvents: 'none', zIndex: 2
                }}>
                    <p style={{ color: '#fff', fontWeight: 600, fontSize: '0.78rem', lineHeight: 1.3, textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
                        {title}
                    </p>
                </div>
            )}
        </div>
    );
};

export default LazyVideo;
