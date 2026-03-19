import React from 'react';

const Card = ({ children, className = '', glass = false, active = false, level = 2, onClick, style = {} }) => {
    const bgMap = {
        1: 'var(--glass-bg-l1)',
        2: 'var(--glass-bg)',
        3: 'var(--glass-bg-l3)',
    };
    const blurMap = {
        1: 'var(--glass-blur-l1)',
        2: 'var(--glass-blur)',
        3: 'var(--glass-blur-l3)',
    };

    const baseStyle = {
        background: bgMap[level] || bgMap[2],
        backdropFilter: `blur(${blurMap[level] || blurMap[2]})`,
        WebkitBackdropFilter: `blur(${blurMap[level] || blurMap[2]})`,
        border: `1px solid ${active ? 'rgba(212,175,55,0.12)' : 'var(--glass-border)'}`,
        borderRadius: level === 3 ? 'var(--border-radius-lg)' : 'var(--border-radius)',
        padding: '24px',
        boxShadow: active
            ? 'var(--glass-shadow), 0px 0px 20px rgba(212,175,55,0.15)'
            : level === 3 ? 'var(--glass-shadow-deep)' : 'var(--glass-shadow)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
    };

    return (
        <div
            className={`csv-card glass-card ${className}`}
            style={baseStyle}
            onClick={onClick}
            onMouseEnter={e => {
                if (onClick) {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.005)';
                    e.currentTarget.style.boxShadow = 'var(--glass-shadow-deep)';
                    e.currentTarget.style.borderColor = 'var(--glass-border-hover)';
                }
            }}
            onMouseLeave={e => {
                if (onClick) {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = active
                        ? 'var(--glass-shadow), 0px 0px 20px rgba(212,175,55,0.15)'
                        : 'var(--glass-shadow)';
                    e.currentTarget.style.borderColor = active
                        ? 'rgba(212,175,55,0.12)'
                        : 'var(--glass-border)';
                }
            }}
        >
            {children}
        </div>
    );
};

export default Card;
