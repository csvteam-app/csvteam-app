import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { TrendingUp, Activity, Award, Calendar, Plus } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Progress = () => {
    const { user, profile } = useAuth();
    const [activeTab, setActiveTab] = useState('strength');

    // Body logs state
    const [bodyLogs, setBodyLogs] = useState([]);
    const [weightInput, setWeightInput] = useState('');
    const [isSavingWeight, setIsSavingWeight] = useState(false);

    // Strength logs state
    const [strengthRecords, setStrengthRecords] = useState([]);
    const [personalRecords, setPersonalRecords] = useState([]);

    useEffect(() => {
        if (!user) return;
        fetchBodyStats();
        fetchStrengthStats();
    }, [user]);

    const fetchBodyStats = async () => {
        const { data } = await supabase
            .from('user_progress_logs')
            .select('date, weight_kg, bodyfat_percent')
            .eq('athlete_id', user.id)
            .order('date', { ascending: true });

        if (data) setBodyLogs(data);
    };

    const fetchStrengthStats = async () => {
        // Fetch Max Set by Exercise (simplified PR logic)
        const { data, error } = await supabase
            .from('logbook_sets')
            .select(`
                weight, reps, created_at,
                exercise:exercises!exercise_id(name, equipment_category)
            `)
            .order('created_at', { ascending: false });

        if (data && data.length > 0) {
            // Group by exercise and find the highest weight
            const prs = {};
            data.forEach(set => {
                const exName = set.exercise?.name;
                if (!exName) return;

                if (!prs[exName] || set.weight > prs[exName].weight) {
                    prs[exName] = {
                        name: exName,
                        weight: set.weight,
                        reps: set.reps,
                        date: new Date(set.created_at).toLocaleDateString('it-IT')
                    };
                }
            });
            setPersonalRecords(Object.values(prs));
        }
    };

    const handleSaveWeight = async () => {
        if (!weightInput || isSavingWeight) return;
        setIsSavingWeight(true);

        const todayStr = new Date().toISOString().split('T')[0];

        const { error } = await supabase
            .from('user_progress_logs')
            .upsert({
                athlete_id: user.id,
                date: todayStr,
                weight_kg: parseFloat(weightInput)
            }, { onConflict: 'athlete_id, date' });

        if (!error) {
            // Also update the main profile so Dashboard syncs
            await supabase.from('profiles').update({ bodyweight: parseFloat(weightInput) }).eq('id', user.id);
            setWeightInput('');
            fetchBodyStats();
        }
        setIsSavingWeight(false);
    };

    return (
        <div className="global-container stagger-children" style={{ paddingBottom: '120px' }}>
            <div className="w-full flex-col gap-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="animate-fade-in" style={{ marginBottom: '8px' }}>
                    <p className="text-label" style={{ marginBottom: '8px' }}>I Tuoi Progressi</p>
                    <h1 className="text-h1">Analisi</h1>
                </div>

            {/* Tabs */}
            <div
                className="flex-row animate-fade-in"
                style={{
                    backgroundColor: 'var(--surface-color-1)',
                    padding: '8px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.04)',
                }}
            >
                {[
                    { key: 'strength', label: 'Storico Forza' },
                    { key: 'body', label: 'Metriche Corpo' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1,
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontFamily: 'Outfit',
                            fontWeight: activeTab === tab.key ? 600 : 400,
                            fontSize: '0.85rem',
                            backgroundColor: activeTab === tab.key ? 'var(--surface-color-2)' : 'transparent',
                            color: activeTab === tab.key ? 'var(--text-main)' : 'var(--text-muted)',
                            transition: 'all 0.2s',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'strength' && (
                <div className="flex-col gap-3 stagger-children">
                    <Card className="animate-fade-in">
                        <h3 className="text-h3 flex-row gap-1 items-center" style={{ marginBottom: '16px' }}>
                            <Award color="var(--accent-teal)" size={17} /> Record Personali (Da Supabase)
                        </h3>
                        {personalRecords.length > 0 ? (
                            <div className="flex-col gap-2">
                                {personalRecords.map((r, i) => (
                                    <div key={i} className="flex-row justify-between" style={{ paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <div>
                                            <span style={{ fontSize: '0.9rem', display: 'block' }}>{r.name}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.date}</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong style={{ color: 'var(--accent-teal)' }}>{r.weight} kg</strong>
                                            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)' }}>× {r.reps} reps</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nessun record registrato. Completa gli allenamenti per creare il tuo storico.</p>
                        )}
                    </Card>

                    <Card glass className="animate-fade-in">
                        <div className="flex-row justify-between items-start" style={{ marginBottom: '16px' }}>
                            <div>
                                <h3 className="text-h3 flex-row gap-1 items-center">
                                    <TrendingUp color="var(--accent-warm)" size={17} /> Storico Recente
                                </h3>
                                <span className="text-small" style={{ color: 'var(--text-muted)' }}>Dal tuo logbook</span>
                            </div>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Il grafico verrà generato automaticamente man mano che completi più sessioni per lo stesso esercizio.</p>
                    </Card>
                </div>
            )}

            {activeTab === 'body' && (
                <div className="flex-col gap-3 stagger-children">
                    <Card className="animate-fade-in">
                        <div className="flex-row justify-between items-center" style={{ marginBottom: '16px' }}>
                            <h3 className="text-h3 flex-row gap-1 items-center">
                                <Activity color="var(--accent-warm)" size={17} /> Andamento Peso
                            </h3>
                            {bodyLogs.length > 0 && (
                                <span className="text-h3" style={{ color: 'var(--accent-warm)' }}>
                                    {bodyLogs[bodyLogs.length - 1].weight_kg} kg
                                </span>
                            )}
                        </div>

                        <div className="flex-col gap-3" style={{ marginBottom: '16px' }}>
                            <div className="flex-row gap-2">
                                <Input
                                    type="number"
                                    placeholder="Inserisci peso (kg)"
                                    value={weightInput}
                                    onChange={e => setWeightInput(e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                <Button onClick={handleSaveWeight} disabled={isSavingWeight || !weightInput}>
                                    Salva
                                </Button>
                            </div>
                        </div>

                        {bodyLogs.length > 0 ? (
                            <div className="flex-col gap-2">
                                {bodyLogs.slice().reverse().map((log, i) => (
                                    <div key={i} className="flex-row justify-between items-center" style={{ padding: '8px', background: 'var(--surface-color-2)', borderRadius: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {new Date(log.date).toLocaleDateString('it-IT')}
                                        </span>
                                        <strong style={{ color: '#fff' }}>{log.weight_kg} kg</strong>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-small" style={{ color: 'var(--text-muted)' }}>Nessun dato registrato.</p>
                        )}
                    </Card>
                </div>
            )}
            </div>
        </div>
    );
};

export default Progress;
