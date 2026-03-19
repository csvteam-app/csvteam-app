import React from 'react';

// Generates a pulsing glassmorphism LED dot based on the traffic light color
const TrafficLightMetric = ({ statusToken = 'status-gray', size = 12, pulsate = false }) => {
    // Map tokens back to explicit CSS variables or colors
    let dotColor = 'var(--status-gray)';
    let glowColor = 'rgba(255,255,255,0.1)';

    if (statusToken.includes('green')) {
        dotColor = 'var(--status-green)';
        glowColor = 'var(--status-green-glow)';
    } else if (statusToken.includes('yellow')) {
        dotColor = 'var(--status-yellow)';
        glowColor = 'rgba(255, 204, 0, 0.4)';
    } else if (statusToken.includes('red')) {
        dotColor = 'var(--status-red)';
        glowColor = 'rgba(255, 107, 107, 0.4)';
    }

    return (
        <div style={{
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: dotColor,
            boxShadow: `0 0 ${size}px ${glowColor}, inset 0 2px 4px rgba(255,255,255,0.4)`,
            animation: pulsate ? 'pulseSlow 3s infinite alternate' : 'none',
            flexShrink: 0
        }}>
            <style>{`
                @keyframes pulseSlow {
                    0% { opacity: 0.8; transform: scale(0.95); }
                    100% { opacity: 1; transform: scale(1.05); }
                }
            `}</style>
        </div>
    );
};

export default TrafficLightMetric;
