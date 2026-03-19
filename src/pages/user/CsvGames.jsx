
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useGamification } from '../../hooks/useGamification';
import ChallengeCard from '../../components/gamification/ChallengeCard';
import StepCounter from '../../components/gamification/StepCounter';
import Button from '../../components/ui/Button';
import { Trophy, ChevronRight, ShoppingBag, Medal } from 'lucide-react';
import PropTypes from 'prop-types';

const LeagueIcon = ({ tier, size = 32 }) => {
    const colors = {
        bronze: '#CD7F32',
        silver: '#C0C0C0',
        gold: 'var(--accent-gold)'
    };
    return <Medal size={size} color={colors[tier] || 'var(--text-muted)'} strokeWidth={1.5} />;
};

LeagueIcon.propTypes = {
    tier: PropTypes.string.isRequired,
    size: PropTypes.number
};

const CsvGames = () => {
    const navigate = useNavigate();
    const { state } = useAppContext();
    const { gamification, dailyTasks, addXpAndPoints, LEAGUES } = useGamification();
    const xp = gamification?.xp || 0;

    const currentLeagueObj = LEAGUES.find(l => l.id === gamification?.current_league);
    const nextLeague = LEAGUES.find(l => xp < l.threshold) || LEAGUES[LEAGUES.length - 1];
    const xpForNext = nextLeague ? nextLeague.threshold : xp;
    const progressPct = nextLeague ? Math.min((xp / nextLeague.threshold) * 100, 100) : 100;
    const xpRemaining = Math.max(xpForNext - xp, 0);

    const dailyChallenges = [
        {
            id: 'ch_neat', type: 'daily', title: 'NEAT 8000 Passi',
            description: 'Raggiungi 8000 passi oggi', target: 8000, current: dailyTasks?.steps ? 8500 : 3400,
            unit: 'passi', rewardXp: 50, rewardPoints: 10,
            status: dailyTasks?.steps ? 'completed' : 'in_progress'
        },
        {
            id: 'ch_workout', type: 'daily', title: 'Workout del Giorno',
            description: 'Completa la tua sessione', target: 1, current: dailyTasks?.workout ? 1 : 0,
            unit: 'sessione', rewardXp: 100, rewardPoints: 20,
            status: dailyTasks?.workout ? 'completed' : 'not_started', requiresProof: true
        },
        {
            id: 'ch_photo', type: 'daily', title: 'Pump Check',
            description: 'Carica una foto post workout', target: 1, current: dailyTasks?.photo ? 1 : 0,
            unit: 'foto', rewardXp: 30, rewardPoints: 5,
            status: dailyTasks?.photo ? 'completed' : 'not_started', requiresProof: true
        }
    ];

    const weeklyChallenges = state.challenges?.filter(c => c.type === 'weekly') || [];

    const handleClaim = async (challengeId) => {
        const ch = dailyChallenges.find(c => c.id === challengeId);
        if (ch) {
            await addXpAndPoints(ch.rewardXp, ch.rewardPoints);
            alert(`Hai riscattato ${ch.rewardXp} XP e ${ch.rewardPoints} CSV Points! (Nota: in produzione questo salverebbe lo stato "claimed" per la singola sfida)`);
        }
    };

    return (
        <div className="global-container stagger-children" style={{ paddingBottom: '120px' }}>

            {/* Top Bar — Currency gems */}
            <div className="animate-fade-in glass-card" style={{
                padding: '24px',
                borderColor: 'rgba(212,175,55,0.1)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                        <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-muted)', fontWeight: 600 }}>
                            Il Tuo Livello
                        </p>
                        <h2 style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                            <Trophy size={20} color="var(--accent-gold)" strokeWidth={1.5} />
                            Lega {currentLeagueObj ? currentLeagueObj.name : 'Nessuna'}
                        </h2>
                    </div>
                    {currentLeagueObj && (
                        <div><LeagueIcon tier={currentLeagueObj.icon} size={40} /></div>
                    )}
                </div>

                {/* Premium XP Progress Bar */}
                <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>{xp.toLocaleString()} XP</span>
                        <span>{xpForNext.toLocaleString()} XP</span>
                    </div>
                    <div className="progress-bar-premium">
                        <div className="progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        {xpRemaining > 0 ? `Mancano ${xpRemaining.toLocaleString()} XP` : 'Livello massimo raggiunto!'}
                    </p>
                </div>

                {/* Next Reward */}
                {nextLeague && xpRemaining > 0 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        marginTop: '16px', padding: '16px', borderRadius: '16px',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                    }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>
                            Prossimo premio: <strong style={{ color: '#fff' }}>{nextLeague.reward}</strong> + {nextLeague.csvPoints} CSV Points
                        </span>
                    </div>
                )}

                <Button variant="outline" fullWidth onClick={() => navigate('/games/rewards')} style={{ marginTop: '16px' }}>
                    <Trophy size={15} strokeWidth={1.5} /> VEDI PREMI LEGA <ChevronRight size={14} />
                </Button>
            </div>

            {/* Step Counter */}
            <StepCounter />

            {/* Daily Challenges */}
            <div className="animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ width: '4px', height: '16px', borderRadius: '2px', background: 'var(--accent-gold)' }} />
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1rem', color: '#fff' }}>Sfide Giornaliere</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {dailyChallenges.map(ch => (
                        <ChallengeCard
                            key={ch.id}
                            challenge={ch}
                            onStart={() => { }}
                            onUploadProof={() => { }}
                            onClaim={handleClaim}
                        />))}
                </div>
            </div>

            {/* Weekly Challenges */}
            <div className="animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ width: '4px', height: '16px', borderRadius: '2px', background: 'rgba(255,255,255,0.3)' }} />
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1rem', color: '#fff' }}>Sfide Settimanali</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {weeklyChallenges.map(ch => (
                        <ChallengeCard
                            key={ch.id}
                            challenge={ch}
                            onStart={() => { }}
                            onUploadProof={() => { }}
                            onClaim={handleClaim}
                        />
                    ))}
                </div>
            </div>

            {/* Shop CTA */}
            <Button variant="outline" fullWidth onClick={() => navigate('/games/shop')} style={{ marginTop: '8px' }}>
                <ShoppingBag size={15} strokeWidth={1.5} /> APRI LO SHOP <ChevronRight size={14} />
            </Button>
        </div>
    );
};

export default CsvGames;
