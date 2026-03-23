import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

/**
 * EquipmentClarification — compact modal asking the user
 * for the smallest available load increment on this equipment.
 */
const EquipmentClarification = ({ question, onConfirm, onDismiss }) => {
    const [customValue, setCustomValue] = useState('');

    if (!question) return null;

    const handleOption = (val) => {
        const numVal = typeof val === 'object' ? val.value : val;
        onConfirm(numVal);
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 999,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        }}>
            <div style={{
                width: '100%', maxWidth: '500px',
                background: 'var(--surface-color)', borderRadius: '24px 24px 0 0',
                padding: '28px 24px 24px',
                animation: 'slideUp 0.3s ease-out',
            }}>
                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-gold)', marginBottom: '8px' }}>
                    ⚙️ Conferma Attrezzatura
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: 1.5 }}>
                    {question.text}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {question.options.map((opt, i) => {
                        const label = typeof opt === 'object' ? opt.label : `${opt} kg`;
                        return (
                            <button
                                key={i}
                                onClick={() => handleOption(opt)}
                                style={{
                                    padding: '14px 16px', borderRadius: '14px',
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                    color: '#fff', fontSize: '0.95rem', fontFamily: 'Outfit', fontWeight: 500,
                                    cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}

                    {question.allowCustom && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <input
                                type="number"
                                placeholder="Altro (kg)"
                                value={customValue}
                                onChange={e => setCustomValue(e.target.value)}
                                style={{
                                    flex: 1, padding: '12px 16px', borderRadius: '14px',
                                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                    color: '#fff', fontSize: '0.95rem', fontFamily: 'Outfit'
                                }}
                            />
                            <button
                                onClick={() => { if (customValue) onConfirm(parseFloat(customValue)); }}
                                style={{
                                    padding: '12px 20px', borderRadius: '14px',
                                    background: 'var(--accent-gold)', border: 'none',
                                    color: '#000', fontWeight: 700, fontFamily: 'Outfit', cursor: 'pointer'
                                }}
                            >
                                OK
                            </button>
                        </div>
                    )}
                </div>

                <button
                    onClick={onDismiss}
                    style={{
                        marginTop: '16px', width: '100%', padding: '12px',
                        background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '14px', color: 'var(--text-muted)', fontSize: '0.85rem',
                        fontFamily: 'Outfit', cursor: 'pointer'
                    }}
                >
                    Salta per ora
                </button>
            </div>
        </div>
    );
};

export default EquipmentClarification;
