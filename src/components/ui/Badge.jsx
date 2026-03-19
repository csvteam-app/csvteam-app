import React from 'react';

const Badge = ({ children, variant = 'gold', className = '' }) => {
    const styles = {
        gold: { bg: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' },
        success: { bg: 'rgba(45,212,191,0.08)', color: '#2dd4bf', border: '1px solid rgba(45,212,191,0.15)' },
        danger: { bg: 'rgba(255,107,107,0.08)', color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.15)' },
        neutral: { bg: 'rgba(255,255,255,0.04)', color: '#b0b0b0', border: '1px solid rgba(255,255,255,0.06)' },
        // keep backward compat
        warm: { bg: 'rgba(212,175,55,0.1)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' },
    };

    const s = styles[variant] || styles.gold;

    return (
        <span
            className={`csv-badge ${className}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 16px',
                borderRadius: '24px',
                backgroundColor: s.bg,
                color: s.color,
                border: s.border,
                fontSize: '0.72rem',
                fontWeight: 600,
                letterSpacing: '0.02em',
            }}
        >
            {children}
        </span>
    );
};

export default Badge;
