import React, { useState, useEffect } from 'react';
import Button from './Button';
import { Play, Square } from 'lucide-react';

const Timer = ({ initialSeconds = 120, onComplete }) => {
    const [timeLeft, setTimeLeft] = useState(initialSeconds);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        setTimeLeft(initialSeconds);
        setIsActive(false);
    }, [initialSeconds]);

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            clearInterval(interval);
            setIsActive(false);
            if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200]);
            }
            if (onComplete) onComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft, onComplete]);

    const toggleTimer = () => {
        if (timeLeft === 0) setTimeLeft(initialSeconds);
        setIsActive(!isActive);
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const progress = ((initialSeconds - timeLeft) / initialSeconds) * 100;

    return (
        <div className="flex-col gap-4" style={{ alignItems: 'center' }}>
            {/* Circular progress indicator */}
            <div style={{ position: 'relative', width: '140px', height: '140px' }}>
                <svg width="140" height="140" viewBox="0 0 140 140">
                    <circle cx="70" cy="70" r="62" fill="none" stroke="var(--surface-color-2)" strokeWidth="6" />
                    <circle
                        cx="70" cy="70" r="62" fill="none"
                        stroke={isActive ? 'var(--accent-warm)' : 'var(--accent-teal)'}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 62}`}
                        strokeDashoffset={`${2 * Math.PI * 62 * (1 - progress / 100)}`}
                        transform="rotate(-90 70 70)"
                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
                    />
                </svg>
                <div
                    style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'Outfit', fontWeight: 700, fontSize: '2.2rem',
                        color: timeLeft === 0 ? 'var(--accent-coral)' : 'var(--text-main)',
                    }}
                >
                    {formatTime(timeLeft)}
                </div>
            </div>

            <Button
                variant={isActive ? 'outline' : 'primary'}
                size="lg"
                onClick={toggleTimer}
                fullWidth
                style={{ maxWidth: '220px' }}
            >
                {isActive ? <><Square size={18} /> Ferma Riposo</> : <><Play size={18} /> Avvia Riposo</>}
            </Button>
        </div>
    );
};

export default Timer;
