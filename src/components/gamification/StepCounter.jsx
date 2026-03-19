import React from 'react';
import { Footprints, RefreshCw } from 'lucide-react';
import { useGamification } from '../../hooks/useGamification';

const StepCounter = ({ compact = false }) => {
    const { dailyTasks, completeDailyTask } = useGamification();
    // In a real app we would read actual steps, but here we just toggle the task
    const isComplete = dailyTasks.steps;
    const steps = isComplete ? 8500 : 3400; // Mock numbers for UI flavor
    const goal = 8000;
    const pct = Math.min((steps / goal) * 100, 100);

    if (compact) {
        return (
            <div style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '20px',
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${isComplete ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)'}`,
            }}>
                <Footprints size={13} strokeWidth={1.5} color={isComplete ? 'var(--accent-gold)' : 'var(--text-muted)'} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'Outfit', color: isComplete ? 'var(--accent-gold)' : 'var(--text-main)' }}>
                    {steps.toLocaleString()}
                </span>
            </div>
        );
    }

    return (
        <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Footprints size={18} strokeWidth={1.5} color="var(--accent-gold)" />
                    <span style={{ fontWeight: 700, fontFamily: 'Outfit', color: '#fff', fontSize: '0.95rem' }}>Contapassi</span>
                </div>
                <button
                    onClick={() => completeDailyTask('steps')}
                    title="Simula passi (demo)"
                    disabled={isComplete}
                    style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px', padding: '6px 10px', cursor: isComplete ? 'default' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '4px',
                        color: isComplete ? 'var(--accent-gold)' : 'var(--text-muted)', fontSize: '0.68rem',
                        transition: 'all 0.25s ease-out',
                        opacity: isComplete ? 0.5 : 1
                    }}
                >
                    <RefreshCw size={11} strokeWidth={1.5} /> Sync
                </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'Outfit', color: isComplete ? 'var(--accent-gold)' : '#fff' }}>
                    {steps.toLocaleString()}
                </span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>/ {goal.toLocaleString()} passi</span>
            </div>

            {/* Premium Gold Progress Bar */}
            <div className="progress-bar-premium">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>

            {isComplete && (
                <p style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: 600, marginTop: '8px' }}>
                    ✓ Obiettivo raggiunto!
                </p>
            )}
        </div>
    );
};

export default StepCounter;
