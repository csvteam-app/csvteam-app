import React from 'react';
import { useAppContext } from '../../context/AppContext';
import Button from '../ui/Button';
import { X, Gift } from 'lucide-react';

const LeaguePopup = () => {
    const { leaguePopup, claimLeagueReward, setLeaguePopup } = useAppContext();

    if (!leaguePopup) return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.3s ease',
        }}>
            <div className="glass-card dopamine-glow" style={{
                width: '90%', maxWidth: '380px',
                padding: '40px 32px',
                textAlign: 'center',
                borderColor: 'rgba(212,175,55,0.4)',
                animation: 'fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
            }}>
                <button
                    onClick={() => setLeaguePopup(null)}
                    style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                    <X size={18} strokeWidth={1.5} />
                </button>

                <div style={{ fontSize: '3.5rem', marginBottom: '12px', animation: 'breathe 2s ease-in-out infinite' }}>
                    🎉
                </div>

                <h2 className="dopamine-text-glow" style={{
                    fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.5rem',
                    color: '#D4AF37', marginBottom: '4px',
                }}>
                    LEGA {leaguePopup.name.toUpperCase()}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '24px', letterSpacing: '0.1em' }}>
                    RAGGIUNTA
                </p>

                <div style={{
                    background: 'rgba(212,175,55,0.05)',
                    border: '1px solid rgba(212,175,55,0.1)',
                    borderRadius: '14px',
                    padding: '20px',
                    marginBottom: '24px',
                }}>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>
                        Premio Sbloccato
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Gift size={18} strokeWidth={1.5} color="var(--accent-gold)" />
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>{leaguePopup.reward}</span>
                    </div>
                    <p style={{ color: 'var(--accent-gold)', fontWeight: 600, fontSize: '0.88rem' }}>
                        + {leaguePopup.csvPoints} CSV Points
                    </p>
                </div>

                <button
                    onClick={() => claimLeagueReward(leaguePopup.id)}
                    className="csv-btn csv-btn-primary csv-btn-lg csv-btn-full"
                >
                    🎁 RISCATTA PREMIO
                </button>
            </div>
        </div>
    );
};

export default LeaguePopup;
