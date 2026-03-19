import React from 'react';

const CsvLogo = ({ size = 48, showText = true, className = '' }) => {
    return (
        <div className={`csv-logo ${className}`} style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: showText ? '2px' : '0',
        }}>
            <img
                src="/images/csv-logo.png"
                alt="CSV Team"
                width={size}
                height={size}
                style={{
                    display: 'block',
                    objectFit: 'contain',
                    /* The invert(1) and sepia filters are now handled globally in Button.css for the night-shift glow */
                }}
            />
            {showText && (
                <span
                    style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 800,
                        fontSize: `${size * 0.3}px`,
                        letterSpacing: '3px',
                        color: '#FFF3E0',
                        fontStyle: 'italic',
                        lineHeight: 1,
                    }}
                >
                    CSV
                </span>
            )}
        </div>
    );
};

export default CsvLogo;
