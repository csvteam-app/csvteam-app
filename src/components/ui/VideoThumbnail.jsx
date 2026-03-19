import React from 'react';
import { PlayCircle } from 'lucide-react';

/**
 * VideoThumbnail — Instant static image thumbnail for Academy videos.
 * Uses pre-generated JPEG images from /thumbnails/ folder.
 * Zero video loading = instant rendering.
 */
const VideoThumbnail = ({ videoUrl, title, muscleGradient, onClick }) => {
    // Derive the thumbnail path from the video URL filename
    const filename = videoUrl ? videoUrl.split('/').pop().replace(/\.mp4$/i, '') : '';
    const thumbnailSrc = `/thumbnails/${filename}.jpg`;

    return (
        <div
            style={{
                minWidth: '180px',
                height: '130px',
                borderRadius: 'var(--border-radius-sm)',
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.08)',
                transition: 'transform 0.2s, border-color 0.2s, box-shadow 0.2s',
                flexShrink: 0,
                background: muscleGradient || 'linear-gradient(135deg, #1a1a2e, #16213e)',
            }}
            onClick={onClick}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
        >
            {/* Static JPEG thumbnail — loads instantly */}
            <img
                src={thumbnailSrc}
                alt={title}
                loading="eager"
                decoding="async"
                style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
            />

            {/* Dark overlay + play icon */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(13,17,23,0.45) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none', zIndex: 2
            }}>
                <PlayCircle size={40} color="rgba(255,255,255,0.85)" style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))' }} />
            </div>

            {/* Title bar */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '16px 12px 12px 12px',
                background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)',
                pointerEvents: 'none', zIndex: 2
            }}>
                <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem', lineHeight: 1.3, textShadow: '0 1px 4px rgba(0,0,0,0.8)', fontFamily: 'Outfit' }}>{title}</p>
            </div>
        </div>
    );
};

export default VideoThumbnail;
