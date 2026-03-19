import React from 'react';

const Input = ({ label, type = 'text', className = '', error, style = {}, ...props }) => {
    return (
        <div className={`flex-col ${className}`} style={{ width: '100%', marginBottom: '16px', gap: '8px' }}>
            {label && (
                <label className="text-label">{label}</label>
            )}
            <input
                type={type}
                style={{
                    width: '100%',
                    padding: '16px 16px',
                    backgroundColor: 'var(--surface-color-2)',
                    border: `1.5px solid ${error ? 'var(--accent-coral)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 'var(--border-radius-sm)',
                    color: 'var(--text-main)',
                    fontSize: '0.95rem',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    fontFamily: 'Inter, sans-serif',
                    ...style,
                }}
                onFocus={e => {
                    e.target.style.borderColor = 'rgba(255, 215, 170, 0.5)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(255, 215, 170, 0.15)';
                    if (props.onFocus) props.onFocus(e);
                }}
                onBlur={e => {
                    e.target.style.borderColor = error ? 'var(--accent-coral)' : 'rgba(255,255,255,0.06)';
                    e.target.style.boxShadow = 'none';
                    if (props.onBlur) props.onBlur(e);
                }}
                {...props}
            />
            {error && <span style={{ color: 'var(--accent-coral)', fontSize: '0.72rem' }}>{error}</span>}
        </div>
    );
};

export default Input;
