import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGamification } from '../../hooks/useGamification';
import Button from '../../components/ui/Button';
import { ArrowLeft, Lock, CheckCircle, Gift, Medal } from 'lucide-react';

const LeagueIcon = ({ tier, size = 32 }) => {
    const colors = {
        bronze: '#CD7F32',
        silver: '#C0C0C0',
        gold: 'var(--accent-gold)'
    };
    return <Medal size={size} color={colors[tier] || 'var(--text-muted)'} strokeWidth={1.5} />;
};

const LeagueRewards = () => {
    const navigate = useNavigate();
    const { gamification: g, LEAGUES } = useGamification();

    return (
        <div className="content-area flex-col gap-6" style={{ paddingBottom: '120px' }}>
            <button
                onClick={() => navigate('/games')}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.82rem' }}
            >
                <ArrowLeft size={17} strokeWidth={1.5} /> Torna alle Sfide
            </button>

            <h1 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.6rem', color: '#fff' }}>
                🏆 Premi Lega
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '-8px' }}>
                Accumula XP completando le sfide per sbloccare premi esclusivi.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {LEAGUES.map(league => {
                    const isUnlocked = g.xp >= league.threshold;
                    const isClaimed = (g.claimedLeagues || []).includes(league.id);
                    const xpMissing = Math.max(league.threshold - g.xp, 0);

                    return (
                        <div key={league.id} className="glass-card" style={{
                            padding: '24px',
                            opacity: !isUnlocked ? 0.5 : 1,
                            borderColor: isClaimed
                                ? 'rgba(212,175,55,0.2)'
                                : isUnlocked
                                    ? 'rgba(212,175,55,0.15)'
                                    : 'var(--glass-border)',
                            boxShadow: isUnlocked
                                ? 'var(--glass-shadow), 0px 0px 18px rgba(212,175,55,0.12)'
                                : 'var(--glass-shadow)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div><LeagueIcon tier={league.icon} size={42} /></div>
                                    <div>
                                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem', color: '#fff' }}>
                                            Lega {league.name}
                                        </h2>
                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            Soglia: {league.threshold.toLocaleString()} XP
                                        </p>
                                    </div>
                                </div>
                                {isClaimed && <CheckCircle size={20} strokeWidth={1.5} color="var(--accent-gold)" />}
                                {!isUnlocked && <Lock size={18} strokeWidth={1.5} color="var(--text-muted)" />}
                            </div>

                            <div style={{
                                display: 'flex', flexDirection: 'column', gap: '8px',
                                padding: '14px', borderRadius: '12px',
                                background: 'rgba(255,255,255,0.02)',
                                border: '1px solid rgba(255,255,255,0.04)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Gift size={15} strokeWidth={1.5} color="var(--accent-gold)" />
                                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>{league.reward}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--accent-gold)' }}>
                                        + {league.csvPoints} CSV Points
                                    </span>
                                </div>
                            </div>

                            <div style={{ marginTop: '14px' }}>
                                {isClaimed && (
                                    <p style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                                        ✓ Premio riscattato
                                    </p>
                                )}
                                {isUnlocked && !isClaimed && (
                                    <p style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                                        🎉 Sbloccata!
                                    </p>
                                )}
                                {!isUnlocked && (
                                    <div>
                                        <div className="progress-bar-premium" style={{ marginBottom: '6px' }}>
                                            <div className="progress-fill" style={{ width: `${(g.xp / league.threshold) * 100}%` }} />
                                        </div>
                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            Mancano <strong style={{ color: 'var(--accent-gold)' }}>{xpMissing.toLocaleString()} XP</strong>
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default LeagueRewards;
