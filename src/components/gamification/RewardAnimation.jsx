import React, { useEffect, useState } from 'react';

const RewardAnimation = ({ xp = 0, points = 0 }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(false), 2200);
        return () => clearTimeout(timer);
    }, []);

    if (!visible) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            pointerEvents: 'none', zIndex: 9999,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: '12px',
        }}>
            {xp > 0 && (
                <div className="dopamine-text-glow drop-shadow-gold" style={{
                    fontSize: '2.5rem', fontWeight: 800, fontFamily: 'Outfit',
                    color: '#D4AF37',
                    animation: 'rewardFloat 2.2s ease-out forwards',
                }}>
                    +{xp} XP
                </div>
            )}
            {points > 0 && (
                <div className="dopamine-text-glow drop-shadow-gold" style={{
                    fontSize: '1.8rem', fontWeight: 700, fontFamily: 'Outfit',
                    color: '#fff',
                    animation: 'rewardFloat 2.2s ease-out 0.2s forwards',
                    opacity: 0,
                }}>
                    +{points} CSV Point{points > 1 ? 's' : ''}
                </div>
            )}

            <style>{`
                @keyframes rewardFloat {
                    0% { opacity: 0; transform: translateY(40px) scale(0.5); }
                    15% { opacity: 1; transform: translateY(0) scale(1.1); }
                    30% { transform: translateY(-5px) scale(1); }
                    70% { opacity: 1; }
                    100% { opacity: 0; transform: translateY(-60px) scale(0.8); }
                }
            `}</style>
        </div>
    );
};

export default RewardAnimation;
