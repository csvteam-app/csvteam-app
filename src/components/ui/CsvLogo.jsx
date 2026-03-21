import { useState } from 'react';

// Import via Vite from src/assets — gets content-hashed and precached by SW
import csvLogoSrc from '../../assets/csv-logo.png';

const CsvLogo = ({ size = 48, showText = true, className = '' }) => {
    const [imgError, setImgError] = useState(false);

    return (
        <div className={`csv-logo ${className}`} style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: showText ? '2px' : '0',
        }}>
            {!imgError ? (
                <img
                    src={csvLogoSrc}
                    alt="CSV Team"
                    width={size}
                    height={size}
                    style={{ display: 'block', objectFit: 'contain' }}
                    onError={() => setImgError(true)}
                />
            ) : (
                /* Fallback: gold circle with "CSV" text */
                <div style={{
                    width: size, height: size, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #D4AF37, #F0A500)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#050508', fontFamily: "'Outfit', sans-serif",
                    fontWeight: 900, fontSize: `${size * 0.3}px`,
                    letterSpacing: '1px',
                }}>CSV</div>
            )}
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
