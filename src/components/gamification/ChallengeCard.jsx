import React, { useState } from 'react';
import { CheckCircle, Circle, Clock, Gift, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import ProofUpload from './ProofUpload';
import Button from '../ui/Button';
import CsvCoin from '../ui/CsvCoin';

const STATUS_CONFIG = {
    not_started: { label: 'Non iniziata', color: 'var(--text-muted)', borderColor: 'var(--glass-border)', icon: Circle },
    in_progress: { label: 'In corso', color: 'var(--accent-gold)', borderColor: 'rgba(212,175,55,0.15)', icon: Clock },
    completed: { label: 'Completata!', color: '#fff', borderColor: 'rgba(212,175,55,0.25)', icon: CheckCircle },
    claimed: { label: 'Riscattata', color: 'var(--text-muted)', borderColor: 'rgba(255,255,255,0.04)', icon: Gift },
};

const ChallengeCard = ({ challenge, onStart, onUploadProof, onClaim }) => {
    const [expanded, setExpanded] = useState(false);
    const cfg = STATUS_CONFIG[challenge.status] || STATUS_CONFIG.not_started;
    const StatusIcon = cfg.icon;
    const pct = challenge.target > 0 ? Math.min((challenge.current / challenge.target) * 100, 100) : 0;
    const isClaimed = challenge.status === 'claimed';
    const isCompleted = challenge.status === 'completed';
    const isActive = challenge.status === 'in_progress';

    return (
        <div className="glass-card" style={{
            padding: '16px',
            opacity: isClaimed ? 0.4 : 1,
            borderColor: cfg.borderColor,
            boxShadow: isActive || isCompleted
                ? 'var(--glass-shadow), 0px 0px 16px rgba(212,175,55,0.18)'
                : 'var(--glass-shadow)',
            transition: 'all 0.25s ease-out',
        }}>
            {/* Header */}
            <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                onClick={() => setExpanded(!expanded)}
            >
                <StatusIcon
                    size={20} color={cfg.color}
                    fill={isCompleted || isClaimed ? cfg.color : 'none'}
                    strokeWidth={1.5}
                />
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
                            {challenge.title}
                        </h4>
                        <span style={{
                            fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase',
                            background: challenge.type === 'daily' ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.05)',
                            color: challenge.type === 'daily' ? 'var(--accent-gold)' : 'var(--text-muted)',
                            padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em',
                        }}>
                            {challenge.type === 'daily' ? 'Giornaliera' : 'Settimanale'}
                        </span>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{challenge.description}</p>
                </div>
                {expanded
                    ? <ChevronUp size={15} color="var(--text-muted)" strokeWidth={1.5} />
                    : <ChevronDown size={15} color="var(--text-muted)" strokeWidth={1.5} />
                }
            </div>

            {/* Progress Bar */}
            <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                        {challenge.id === 'ch_neat'
                            ? `${(challenge.current || 0).toLocaleString()} / ${challenge.target.toLocaleString()} ${challenge.unit}`
                            : `${challenge.current} / ${challenge.target} ${challenge.unit}`
                        }
                    </span>
                    <span style={{ fontSize: '0.68rem', color: cfg.color, fontWeight: 600 }}>{cfg.label}</span>
                </div>
                <div className="progress-bar-premium">
                    <div className="progress-fill" style={{
                        width: `${pct}%`,
                        background: isCompleted || isClaimed
                            ? 'var(--gradient-gold-bar)'
                            : 'var(--gradient-gold-bar)',
                    }} />
                </div>
            </div>

            {/* Reward Preview */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                marginTop: '10px',
            }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={12} strokeWidth={1.5} /> {challenge.rewardXp} XP
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CsvCoin size={14} /> <span style={{ paddingTop: '1px' }}>{challenge.rewardPoints} CSV Points</span>
                </span>
            </div>

            {/* Expanded Content */}
            {expanded && !isClaimed && (
                <div style={{
                    marginTop: '8px', paddingTop: '12px',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                }}>
                    {challenge.steps && challenge.steps.map((stepLabel, i) => {
                        const proofExists = (challenge.proofs || []).length > i;
                        return (
                            <ProofUpload
                                key={i} type={challenge.proofType || 'photo'}
                                stepLabel={`Step ${i + 1}: ${stepLabel}`}
                                onUpload={(data) => onUploadProof(challenge.id, { ...data, step: i + 1 })}
                                disabled={proofExists}
                            />
                        );
                    })}

                    {challenge.requiresProof && !challenge.steps && (
                        <ProofUpload
                            type={challenge.proofType || 'photo'}
                            stepLabel="Carica la tua prova"
                            onUpload={(data) => onUploadProof(challenge.id, data)}
                            disabled={challenge.current >= challenge.target}
                        />
                    )}

                    {challenge.id === 'ch_neat' && (
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            📱 Tracciamento automatico tramite contapassi
                        </p>
                    )}

                    {challenge.status === 'not_started' && challenge.requiresProof && (
                        <Button variant="outline" size="sm" onClick={() => onStart(challenge.id)}>
                            Inizia Sfida
                        </Button>
                    )}

                    {isCompleted && (
                        <button
                            onClick={() => onClaim(challenge.id)}
                            className="csv-btn csv-btn-teal csv-btn-md csv-btn-full glow-gold"
                        >
                            🎁 Riscatta Ricompensa
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChallengeCard;
