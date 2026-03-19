import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { genericFoods } from '../data/genericFoods';

const AppContext = createContext();

/* ─── Utility ─── */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/* ─── Leagues Definition ─── */
const LEAGUES = [
    { id: 'bronze', name: 'Bronzo', threshold: 5000, reward: 'Asciugamano CSV Team', csvPoints: 25, icon: 'bronze' },
    { id: 'silver', name: 'Argento', threshold: 15000, reward: 'Maglia CSV Team', csvPoints: 100, icon: 'silver' },
    { id: 'gold', name: 'Oro', threshold: 30000, reward: 'Canotta CSV Team / Top Femminile', csvPoints: 250, icon: 'gold' },
];

/* ─── Default Challenges ─── */
const getDefaultChallenges = () => [
    {
        id: 'ch_neat', type: 'daily', title: 'NEAT 8000 Passi',
        description: 'Raggiungi 8000 passi oggi',
        target: 8000, current: 0, unit: 'passi',
        rewardXp: 40, rewardPoints: 1,
        status: 'not_started', // not_started | in_progress | completed | claimed
        requiresProof: false, proofType: null, proofs: [],
    },
    {
        id: 'ch_workout', type: 'daily', title: 'Check Allenamento',
        description: 'Completa il tuo allenamento e carica una foto pump',
        target: 1, current: 0, unit: 'foto',
        rewardXp: 40, rewardPoints: 1,
        status: 'not_started',
        requiresProof: true, proofType: 'photo', proofs: [],
    },
    {
        id: 'ch_definition', type: 'weekly', title: 'Definizione',
        description: 'Perdi 0.5 kg in 5 giorni',
        target: 2, current: 0, unit: 'step',
        rewardXp: 250, rewardPoints: 6,
        status: 'not_started',
        requiresProof: true, proofType: 'video',
        proofs: [], // [{step: 1, url, timestamp}, {step: 2, ...}]
        steps: ['Video bilancia peso iniziale', 'Video bilancia peso finale (-0.5kg)'],
        maxDays: 5, startedAt: null,
    },
    {
        id: 'ch_progress', type: 'weekly', title: 'Progresso Allenamento',
        description: '+1 ripetizione a parità di carico',
        target: 2, current: 0, unit: 'step',
        rewardXp: 250, rewardPoints: 6,
        status: 'not_started',
        requiresProof: true, proofType: 'video',
        proofs: [],
        steps: ['Video esercizio con carico e reps attuali', 'Video stesso esercizio con +1 rep'],
    },
];

/* ─── Shop Items ─── */
const defaultShopItems = [
    { id: 'sh1', name: 'Shaker CSV Team', price: 15, image: 'CupSoda', category: 'Gadget' },
    { id: 'sh2', name: 'Fascia da Polso', price: 10, image: 'Activity', category: 'Gadget' },
    { id: 'sh3', name: 'Sconto 10% Coaching', price: 50, image: 'TicketPercent', category: 'Sconto' },
    { id: 'sh4', name: 'Sconto 20% Coaching', price: 90, image: 'TicketPercent', category: 'Sconto' },
    { id: 'sh5', name: 'Piano Alimentare Premium', price: 30, image: 'UtensilsCrossed', category: 'Contenuto' },
    { id: 'sh6', name: 'Video Masterclass Posing', price: 25, image: 'Clapperboard', category: 'Contenuto' },
    { id: 'sh7', name: 'Cappellino CSV Team', price: 20, image: 'Crown', category: 'Gadget' },
    { id: 'sh8', name: 'Borsa Palestra CSV', price: 40, image: 'Briefcase', category: 'Gadget' },
];

/* ─── Initial Data ─── */
const initialMockData = {
    /* ──── Auth ──── */
    adminAuth: null,
    userAuth: null,
    adminUsers: [
        { id: 'adm1', email: 'admin@csvteam.com', password_hash: 'admin123', role: 'super_admin', created_at: '2026-01-01' },
    ],

    /* ──── Clients ──── */
    clients: [
        {
            id: 'u1', name: 'Elite Lifter', email: 'lifter@csv.com', streak: 5, bodyweight: 85.5, assignedProgramId: 'p1',
            credit_singola_total: 5, credit_singola_used: 2, credit_singola_remaining: 3,
            credit_coppia_total: 0, credit_coppia_used: 0, credit_coppia_remaining: 0,
            availability: ['Monday-18:00', 'Wednesday-19:00', 'Thursday-20:00'],
            lesson_preference: 'singola',
            nutritionTargets: { kcal: 2800, p: 200, c: 350, f: 65 },
        },
        {
            id: 'u2', name: 'Mark Andrews', email: 'mark@csv.com', streak: 12, bodyweight: 92.0, assignedProgramId: null,
            credit_singola_total: 0, credit_singola_used: 0, credit_singola_remaining: 0,
            credit_coppia_total: 4, credit_coppia_used: 1, credit_coppia_remaining: 3,
            availability: ['Tuesday-18:00', 'Thursday-19:00'],
            lesson_preference: 'coppia',
            nutritionTargets: { kcal: 3200, p: 230, c: 400, f: 75 },
        },
        {
            id: 'u3', name: 'Sarah Connor', email: 'sarah@csv.com', streak: 2, bodyweight: 65.0, assignedProgramId: null,
            credit_singola_total: 10, credit_singola_used: 10, credit_singola_remaining: 0,
            credit_coppia_total: 2, credit_coppia_used: 1, credit_coppia_remaining: 1,
            availability: ['Tuesday-18:00', 'Friday-14:00'],
            lesson_preference: 'coppia',
            nutritionTargets: { kcal: 1800, p: 130, c: 200, f: 50 },
        },
    ],

    /* ──── Lessons & Orders ──── */
    lessons: [
        { id: 'l1', client1_id: 'u1', client2_id: null, type: 'singola', date: '2026-03-10', time: '18:00', duration: 60, package_used: 'Singola', status: 'prenotata', notes: '' },
        { id: 'l2', client1_id: 'u1', client2_id: null, type: 'singola', date: '2026-03-01', time: '19:00', duration: 60, package_used: 'Singola', status: 'svolta', notes: 'Ottima panca' },
        { id: 'l3', client1_id: 'u2', client2_id: 'u3', type: 'coppia', date: '2026-03-12', time: '18:00', duration: 60, package_used: 'Coppia', status: 'prenotata', notes: '' },
    ],
    orders: [],

    /* ──── Exercise Library ──── */
    exercises: [
        { id: 'ex1', name: 'Panca Inclinata con Bilanciere', muscle_group: 'chest', equipment_category: 'barbell', tags: ['bilanciere', 'compound'], videoId: 'v1' },
        { id: 'ex2', name: 'Trazioni Zavorrate', muscle_group: 'back', equipment_category: 'bodyweight', tags: ['peso corporeo'], videoId: null },
        { id: 'ex3', name: 'Lento Avanti', muscle_group: 'shoulders', equipment_category: 'barbell', tags: ['bilanciere'], videoId: null },
        { id: 'ex4', name: 'Squat con Bilanciere', muscle_group: 'legs', equipment_category: 'barbell', tags: ['bilanciere', 'compound'], videoId: 'v2' },
        { id: 'ex5', name: 'Stacco Rumeno', muscle_group: 'legs', equipment_category: 'barbell', tags: ['bilanciere'], videoId: null },
        { id: 'ex6', name: 'Curl con Bilanciere', muscle_group: 'biceps', equipment_category: 'barbell', tags: ['bilanciere'], videoId: null },
        { id: 'ex7', name: 'Push Down ai Cavi', muscle_group: 'triceps', equipment_category: 'cable_machine', tags: ['cavi'], videoId: null },
        { id: 'ex8', name: 'Hip Thrust', muscle_group: 'glutes', equipment_category: 'barbell', tags: ['bilanciere'], videoId: null },
        { id: 'ex9', name: 'Crunch ai Cavi', muscle_group: 'abs', equipment_category: 'cable_machine', tags: ['cavi'], videoId: null },
        { id: 'ex10', name: 'Panca Piana con Manubri', muscle_group: 'chest', equipment_category: 'dumbbell', tags: ['manubri'], videoId: null },
    ],

    /* ──── Videos ──── */
    videos: [
        { id: 'v1', title: 'Tecnica Perfetta Panca Inclinata', exerciseId: 'ex1', storagePath: null, thumbnail: null, uploadedBy: 'adm1', created_at: '2026-02-15' },
        { id: 'v2', title: 'Profondità e Posizione nello Squat', exerciseId: 'ex4', storagePath: null, thumbnail: null, uploadedBy: 'adm1', created_at: '2026-02-20' },
    ],

    /* ──── Nutrition ──── */
    foods: genericFoods,
    nutritionLogs: {},
    nutritionGoals: { kcal: 2800, p: 200, c: 350, f: 65 },

    /* ──── Programs ──── */
    programs: [
        {
            id: 'p1',
            title: 'CSV Ipertrofia Fase 1',
            type: 'template',
            userId: null,
            createdBy: 'adm1',
            created_at: '2026-02-01',
            days: [
                {
                    id: 'pd1', dayCode: 'A', name: 'Upper Body Potenza',
                    exercises: [
                        { id: 'pe1', exerciseId: 'ex1', order: 0, sets: 4, reps: '6-12', rest: 120, noteType: null, noteText: '', linkedSupersetId: null },
                        { id: 'pe2', exerciseId: 'ex2', order: 1, sets: 4, reps: '6-10', rest: 120, noteType: null, noteText: '', linkedSupersetId: null },
                        { id: 'pe3', exerciseId: 'ex3', order: 2, sets: 3, reps: '8-12', rest: 90, noteType: 'rpe', noteText: 'RPE 8', linkedSupersetId: null },
                    ],
                },
                {
                    id: 'pd2', dayCode: 'B', name: 'Lower Body Potenza',
                    exercises: [
                        { id: 'pe4', exerciseId: 'ex4', order: 0, sets: 4, reps: '4-8', rest: 150, noteType: null, noteText: '', linkedSupersetId: null },
                        { id: 'pe5', exerciseId: 'ex5', order: 1, sets: 3, reps: '8-12', rest: 120, noteType: null, noteText: '', linkedSupersetId: null },
                    ],
                },
            ],
        },
    ],

    /* ──── Gamification ──── */
    gamification: {
        xp: 3420,
        csvPoints: 12,
        currentLeague: 'none',
        claimedLeagues: [],
        stepsToday: 4280,
        lastStepReset: new Date().toDateString(),
        stepsHistory: [
            { date: '2026-03-01', steps: 7200 },
            { date: '2026-03-02', steps: 8100 },
            { date: '2026-03-03', steps: 6800 },
            { date: '2026-03-04', steps: 9500 },
            { date: '2026-03-05', steps: 7400 },
            { date: '2026-03-06', steps: 8600 },
            { date: '2026-03-07', steps: 4280 },
        ],
        daily: { steps: false, workout: false, photo: false, claimed: false, lastReset: new Date().toDateString() },
        workoutsCompleted: 128,
        bestStreak: 21,
        timeline: [
            { id: 't1', title: 'Workout completato', xpGained: 40, type: 'workout', date: new Date().toISOString() },
            { id: 't2', title: 'Foto pump caricata', xpGained: 40, type: 'photo', date: new Date().toISOString() },
            { id: 't3', title: 'Traguardo 6 giorni streak', xpGained: null, type: 'streak', date: new Date(Date.now() - 86400000).toISOString() },
            { id: 't4', title: 'Sfida completata', xpGained: 250, type: 'challenge', date: new Date(Date.now() - 86400000 * 3).toISOString() },
        ]
    },
    challenges: getDefaultChallenges(),
    shopItems: defaultShopItems,
    purchases: [],

    /* ──── User-facing (backward compat) ──── */
    user: { id: 'u1', name: 'Elite Lifter', streak: 5, bodyweight: 85.5 },
    logbook: {
        'ex1': [
            { date: '2026-02-25', weight: 75, reps: 10 }, { date: '2026-02-25', weight: 75, reps: 9 }, { date: '2026-02-25', weight: 75, reps: 8 },
            { date: '2026-03-01', weight: 77.5, reps: 9 }, { date: '2026-03-01', weight: 77.5, reps: 8 }, { date: '2026-03-01', weight: 77.5, reps: 7 },
            { date: '2026-03-04', weight: 80, reps: 12 }, { date: '2026-03-04', weight: 80, reps: 11 }, { date: '2026-03-04', weight: 80, reps: 10 }, { date: '2026-03-04', weight: 80, reps: 9 },
        ],
        'ex4': [
            { date: '2026-02-28', weight: 130, reps: 6 }, { date: '2026-02-28', weight: 130, reps: 6 }, { date: '2026-02-28', weight: 130, reps: 5 },
            { date: '2026-03-02', weight: 135, reps: 6 }, { date: '2026-03-02', weight: 135, reps: 5 }, { date: '2026-03-02', weight: 135, reps: 5 },
        ],
    },
    confirmedIncrements: {},
    academy: [
        { id: 'v1', title: 'Tecnica Perfetta Panca Inclinata', category: 'Chest', url: '#' },
        { id: 'v2', title: 'Profondità e Posizione nello Squat', category: 'Legs', url: '#' },
    ],
    checkins: [
        { id: 'chk1', workoutId: 'pd1', userId: 'u1', date: '2026-03-05', difficulty: 'Just right', pump: 'High', energy: 'Medium' }
    ],
    chatMessages: [
        { id: 'cm1', chat_type: 'community', user_id: 'u2', username: 'Mark Andrews', league_badge: 'silver', message_type: 'text', content: 'Ottimo allenamento oggi ragazzi! 💪', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 'cm2', chat_type: 'coach', user_id: 'u1', sender_type: 'user', message_type: 'text', content: 'Ciao Coach, la panca ieri era pesante. Che faccio la prossima?', timestamp: new Date(Date.now() - 86400000).toISOString() },
        { id: 'cm3', chat_type: 'coach', user_id: 'u1', sender_type: 'coach', coach_name: 'Coach CSV', message_type: 'text', content: 'Mantieni lo stesso carico, concentrati sulla negativa.', timestamp: new Date(Date.now() - 86000000).toISOString() }
    ],
};

/* ─────────────────────────────────────
   PROVIDER
   ───────────────────────────────────── */
export function AppProvider({ children }) {
    const [state, setState] = useState(() => {
        try {
            const saved = localStorage.getItem('csvteam_data_v3');
            if (saved) {
                const parsed = JSON.parse(saved);
                return {
                    ...initialMockData,
                    ...parsed,
                    // always refresh shop items & league defs from code
                    shopItems: defaultShopItems,
                };
            }
            return initialMockData;
        } catch { return initialMockData; }
    });

    // Reward animation state (not persisted)
    const [rewardPopup, setRewardPopup] = useState(null); // { xp, points }
    const [leaguePopup, setLeaguePopup] = useState(null); // league object

    useEffect(() => {
        // PERF FIX: Disabling sync saving of massive mock state to localStorage
        // This was freezing the main thread on every state update.
        // Persistence should now happen purely via Supabase.
        // localStorage.setItem('csvteam_data_v3', JSON.stringify(state));
    }, [state]);

    /* ── helpers ── */
    const set = (fn) => setState(prev => ({ ...prev, ...fn(prev) }));

    /* ══════════════════════════════════
       GAMIFICATION
       ══════════════════════════════════ */

    const addXP = useCallback((amount, points = 0) => {
        setState(prev => {
            const g = { ...prev.gamification };
            g.xp += amount;
            g.csvPoints += points;

            // Check if a new league was reached
            const unclaimedLeague = LEAGUES.find(
                l => g.xp >= l.threshold && !g.claimedLeagues.includes(l.id) && g.currentLeague !== l.id
            );

            // Update currentLeague based on highest reached threshold
            const reached = LEAGUES.filter(l => g.xp >= l.threshold);
            if (reached.length > 0) {
                g.currentLeague = reached[reached.length - 1].id;
            }

            // Show popup for unclaimed league
            if (unclaimedLeague) {
                setTimeout(() => setLeaguePopup(unclaimedLeague), 600);
            }

            return { ...prev, gamification: g };
        });
        if (amount > 0 || points > 0) {
            setRewardPopup({ xp: amount, points });
            setTimeout(() => setRewardPopup(null), 2500);
        }
    }, []);

    const addTimelineEvent = useCallback((title, xpGained, type) => {
        setState(prev => {
            const g = { ...prev.gamification };
            if (!g.timeline) g.timeline = [];
            const newEvent = { id: uid(), title, xpGained, type, date: new Date().toISOString() };
            g.timeline = [newEvent, ...g.timeline];
            return { ...prev, gamification: g };
        });
    }, []);

    const claimLeagueReward = useCallback((leagueId) => {
        setState(prev => {
            const league = LEAGUES.find(l => l.id === leagueId);
            if (!league) return prev;
            const g = { ...prev.gamification };
            g.claimedLeagues = [...(g.claimedLeagues || []), leagueId];
            g.csvPoints += league.csvPoints;
            return { ...prev, gamification: g };
        });
        setLeaguePopup(null);
    }, []);

    const completeDailyTask = useCallback((taskName) => {
        setState(prev => {
            const today = new Date().toDateString();
            const g = { ...prev.gamification };

            // Re-initialize daily structure if old state format is encountered
            if (!g.daily) {
                g.daily = { steps: false, workout: false, photo: false, claimed: false, lastReset: today };
            }

            // Daily reset for the tracker
            if (g.daily.lastReset !== today) {
                g.daily = { steps: false, workout: false, photo: false, claimed: false, lastReset: today };
            }

            const dailyState = { ...g.daily };

            // Apply boolean update
            if (taskName === 'steps') dailyState.steps = true;
            if (taskName === 'workout') dailyState.workout = true;
            if (taskName === 'photo') dailyState.photo = true;

            let claimedBonus = false;

            // Check completion threshold
            if (dailyState.steps && dailyState.workout && dailyState.photo && !dailyState.claimed) {
                dailyState.claimed = true;
                claimedBonus = true;
            }

            g.daily = dailyState;

            return { ...prev, gamification: g, __claimedBonus: claimedBonus };
        });

        // Use a functional hook trick to invoke addXP out of the setState block if bonus was claimed
        setTimeout(() => {
            setState(current => {
                if (current.__claimedBonus) {
                    addXP(20, 0); // Grant 20 XP bonus instantly
                    addTimelineEvent('Daily Completed', 20, 'challenge');
                    return { ...current, __claimedBonus: false };
                }
                return current;
            });
        }, 100);
    }, [addXP, addTimelineEvent]);

    const updateSteps = useCallback((steps) => {
        setState(prev => {
            const g = { ...prev.gamification };
            const today = new Date().toDateString();

            // Daily reset
            if (g.lastStepReset !== today) {
                g.stepsToday = 0;
                g.lastStepReset = today;
            }
            g.stepsToday = steps;

            // Auto-update NEAT challenge
            const challenges = prev.challenges.map(ch => {
                if (ch.id === 'ch_neat') {
                    const newCh = { ...ch, current: steps };
                    if (steps >= ch.target && ch.status !== 'completed' && ch.status !== 'claimed') {
                        newCh.status = 'completed';
                    } else if (steps > 0 && ch.status === 'not_started') {
                        newCh.status = 'in_progress';
                    }
                    return newCh;
                }
                return ch;
            });

            // Trigger daily step completion conditionally
            if (steps >= 8000) {
                setTimeout(() => completeDailyTask('steps'), 100);
            }

            return { ...prev, gamification: g, challenges };
        });
    }, [completeDailyTask]);

    const simulateSteps = useCallback(() => {
        // Add random steps for demo purposes
        setState(prev => {
            const newSteps = Math.min((prev.gamification.stepsToday || 0) + Math.floor(Math.random() * 1500) + 500, 15000);
            return prev; // we'll use updateSteps instead
        });
        const current = state.gamification.stepsToday || 0;
        const added = Math.floor(Math.random() * 1500) + 500;
        updateSteps(Math.min(current + added, 15000));
    }, [state.gamification.stepsToday, updateSteps]);

    const startChallenge = useCallback((challengeId) => {
        set(s => ({
            challenges: s.challenges.map(ch =>
                ch.id === challengeId && ch.status === 'not_started'
                    ? { ...ch, status: 'in_progress', startedAt: Date.now() }
                    : ch
            ),
        }));
    }, []);

    const uploadProof = useCallback((challengeId, proofData) => {
        // Trigger generic photo daily completion requirement if the challenge is related to workouts (e.g photo pump)
        // or trigger it instantly whenever they upload
        if (challengeId === 'ch_workout') {
            completeDailyTask('photo');
        }

        set(s => ({
            challenges: s.challenges.map(ch => {
                if (ch.id !== challengeId) return ch;
                const newCh = { ...ch };
                newCh.proofs = [...(ch.proofs || []), { ...proofData, timestamp: Date.now() }];
                newCh.current = newCh.proofs.length;
                if (newCh.status === 'not_started') newCh.status = 'in_progress';
                if (newCh.current >= newCh.target) newCh.status = 'completed';
                return newCh;
            }),
        }));
    }, [completeDailyTask]);

    const claimChallenge = useCallback((challengeId) => {
        const ch = state.challenges.find(c => c.id === challengeId);
        if (!ch || ch.status !== 'completed') return;
        set(s => ({
            challenges: s.challenges.map(c =>
                c.id === challengeId ? { ...c, status: 'claimed' } : c
            ),
        }));
        addXP(ch.rewardXp, ch.rewardPoints);
        addTimelineEvent(`Sfida: ${ch.title}`, ch.rewardXp, 'challenge');
    }, [state.challenges, addXP, addTimelineEvent]);

    const resetDailyChallenges = useCallback(() => {
        set(s => ({
            challenges: s.challenges.map(ch =>
                ch.type === 'daily' ? { ...getDefaultChallenges().find(d => d.id === ch.id) || ch } : ch
            ),
        }));
    }, []);

    const purchaseShopItem = useCallback((itemId) => {
        const item = state.shopItems.find(i => i.id === itemId);
        if (!item || state.gamification.csvPoints < item.price) return false;
        set(s => ({
            gamification: { ...s.gamification, csvPoints: s.gamification.csvPoints - item.price },
            purchases: [...(s.purchases || []), { itemId, purchasedAt: Date.now() }],
        }));
        return true;
    }, [state.shopItems, state.gamification.csvPoints]);

    /* ─── User Auth ─── */
    const userLogin = (email, password) => {
        const client = state.clients.find(c => c.email === email && password === 'user123');
        if (!client) return false;
        set(() => ({
            userAuth: {
                id: client.id, email: client.email, name: client.name,
                taxCode: client.taxCode || '', address: client.address || '', province: client.province || ''
            }
        }));
        return true;
    };

    const userRegister = (userData) => {
        const newClient = { id: uid(), ...userData, streak: 0, bodyweight: 70, assignedProgramId: null };
        set(s => ({
            clients: [...s.clients, newClient],
            userAuth: {
                id: newClient.id, email: newClient.email, name: newClient.name,
                taxCode: newClient.taxCode, address: newClient.address, province: newClient.province
            }
        }));
        return true;
    };

    const userLogout = () => set(() => ({ userAuth: null }));

    /* ─── Auth ─── */
    const adminLogin = (email, password) => {
        const user = state.adminUsers.find(u => u.email === email && u.password_hash === password);
        if (!user) return false;
        set(() => ({ adminAuth: { id: user.id, email: user.email, role: user.role } }));
        return true;
    };
    const adminLogout = () => set(() => ({ adminAuth: null }));

    /* ─── Exercises ─── */
    const addExercise = (exercise) => set(s => ({ exercises: [...s.exercises, { ...exercise, id: uid() }] }));
    const updateExercise = (id, updates) => set(s => ({ exercises: s.exercises.map(e => e.id === id ? { ...e, ...updates } : e) }));
    const deleteExercise = (id) => set(s => ({ exercises: s.exercises.filter(e => e.id !== id) }));

    /* ─── Videos ─── */
    const addVideo = (video) => {
        const vid = { ...video, id: uid(), uploadedBy: state.adminAuth?.id || 'adm1', created_at: new Date().toISOString().split('T')[0] };
        set(s => ({
            videos: [...s.videos, vid],
            exercises: s.exercises.map(e => e.id === video.exerciseId ? { ...e, videoId: vid.id } : e),
            academy: [...s.academy, { id: vid.id, title: vid.title, category: s.exercises.find(e => e.id === video.exerciseId)?.muscle_group || 'Other', url: vid.storagePath || '#' }],
        }));
        return vid.id;
    };

    /* ─── Programs ─── */
    const createProgram = (program) => set(s => ({
        programs: [...s.programs, { ...program, id: uid(), createdBy: s.adminAuth?.id || 'adm1', created_at: new Date().toISOString().split('T')[0] }],
    }));
    const updateProgram = (id, updates) => set(s => ({ programs: s.programs.map(p => p.id === id ? { ...p, ...updates } : p) }));
    const deleteProgram = (id) => set(s => ({ programs: s.programs.filter(p => p.id !== id) }));

    const duplicateProgram = (id) => {
        const src = state.programs.find(p => p.id === id);
        if (!src) return;
        const newProg = {
            ...JSON.parse(JSON.stringify(src)), id: uid(), title: src.title + ' (Copia)',
            type: 'template', userId: null, created_at: new Date().toISOString().split('T')[0],
            days: src.days.map(d => ({ ...JSON.parse(JSON.stringify(d)), id: uid(), exercises: d.exercises.map(e => ({ ...e, id: uid() })) })),
        };
        set(s => ({ programs: [...s.programs, newProg] }));
        return newProg.id;
    };

    const duplicateDay = (programId, dayId) => {
        set(s => ({
            programs: s.programs.map(p => {
                if (p.id !== programId) return p;
                const src = p.days.find(d => d.id === dayId);
                if (!src) return p;
                const codes = 'ABCDEFGHIJKLMNOP';
                const newDay = {
                    ...JSON.parse(JSON.stringify(src)), id: uid(),
                    dayCode: codes[p.days.length] || `${p.days.length + 1}`, name: src.name + ' (Copia)',
                    exercises: src.exercises.map(e => ({ ...e, id: uid() })),
                };
                return { ...p, days: [...p.days, newDay] };
            }),
        }));
    };

    const assignProgramToClient = (programId, clientId) => {
        const src = state.programs.find(p => p.id === programId);
        if (!src) return;
        const clone = {
            ...JSON.parse(JSON.stringify(src)), id: uid(), type: 'user_program', userId: clientId,
            title: src.title, created_at: new Date().toISOString().split('T')[0],
            days: src.days.map(d => ({ ...JSON.parse(JSON.stringify(d)), id: uid(), exercises: d.exercises.map(e => ({ ...e, id: uid() })) })),
        };
        set(s => ({
            programs: [...s.programs, clone],
            clients: s.clients.map(c => c.id === clientId ? { ...c, assignedProgramId: clone.id } : c),
        }));
    };

    /* ─── Nutrition ─── */
    const addFoodLog = (date, meal, food, grams) => {
        set(s => {
            const logs = { ...s.nutritionLogs };
            if (!logs[date]) logs[date] = { meals: { colazione: [], pranzo: [], cena: [], snack: [] }, goals: { ...s.nutritionGoals } };
            logs[date].meals[meal].push({ ...food, grams, logged_id: uid() });
            return { nutritionLogs: logs };
        });
    };

    const removeFoodLog = (date, meal, loggedId) => {
        set(s => {
            const logs = { ...s.nutritionLogs };
            if (logs[date]) logs[date].meals[meal] = logs[date].meals[meal].filter(f => f.logged_id !== loggedId);
            return { nutritionLogs: logs };
        });
    };

    const updateNutritionGoals = (goals) => set(s => ({ nutritionGoals: { ...s.nutritionGoals, ...goals } }));

    /* ─── Logbook ─── */
    const updateLogbook = (exerciseId, logEntry) => {
        set(s => {
            const newLogbook = { ...s.logbook, [exerciseId]: [...(s.logbook[exerciseId] || []), logEntry] };
            return { logbook: newLogbook };
        });

        // Register workout in timeline roughly
        addTimelineEvent('Serie registrata', 5, 'workout');
        addXP(5, 0);
    };

    /* ─── Admin Lessons Management ─── */
    const markLessonCompleted = (lessonId) => {
        set(s => {
            const lesson = s.lessons.find(l => l.id === lessonId);
            if (!lesson || lesson.status === 'svolta') return s;

            // Mark completed
            const newLessons = s.lessons.map(l => l.id === lessonId ? { ...l, status: 'svolta' } : l);
            const newClients = [...s.clients];

            // Decrement credits
            const updateClientCredit = (clientId) => {
                const cIndex = newClients.findIndex(c => c.id === clientId);
                if (cIndex === -1) return;
                const c = { ...newClients[cIndex] };
                if (lesson.type === 'singola' && c.credit_singola_remaining > 0) {
                    c.credit_singola_remaining -= 1;
                    c.credit_singola_used += 1;
                } else if (lesson.type === 'coppia' && c.credit_coppia_remaining > 0) {
                    c.credit_coppia_remaining -= 1;
                    c.credit_coppia_used += 1;
                }
                newClients[cIndex] = c;
            };

            updateClientCredit(lesson.client1_id);
            if (lesson.client2_id) updateClientCredit(lesson.client2_id);

            return { lessons: newLessons, clients: newClients };
        });
    };

    const updateLessonStatus = (lessonId, status) => set(s => ({
        lessons: s.lessons.map(l => l.id === lessonId ? { ...l, status } : l)
    }));

    const updateClientAvailability = (clientId, newAvailability, preference) => {
        set(s => ({
            clients: s.clients.map(c => c.id === clientId ? { ...c, availability: newAvailability, lesson_preference: preference } : c)
        }));
    };

    const createCoupleLesson = (client1_id, client2_id, date, time) => {
        set(s => ({
            lessons: [{
                id: uid(), client1_id, client2_id, type: 'coppia', date, time, duration: 60, package_used: 'Coppia', status: 'prenotata', notes: ''
            }, ...s.lessons]
        }));
    };

    const scheduleLesson = (clientId, date, time, type) => {
        set(s => ({
            lessons: [{
                id: uid(), client1_id: clientId, client2_id: null, type, date, time, duration: 60, package_used: type === 'singola' ? 'Singola' : 'Coppia', status: 'prenotata', notes: ''
            }, ...s.lessons]
        }));
    };

    /* ─── Post-Workout Check-ins ─── */
    const submitWorkoutCheckin = (workoutId, checkinData) => {
        const userId = state.userAuth?.id || 'u1';
        const newCheckin = {
            id: uid(),
            workoutId,
            userId,
            date: new Date().toISOString().split('T')[0],
            ...checkinData,
        };
        set(s => ({
            checkins: [newCheckin, ...(s.checkins || [])]
        }));
    };

    /* ─── Chat ─── */
    const sendCoachMessage = (content, messageType = 'text', senderType = 'user', coachName = null, userIdOverride = null) => {
        const userId = userIdOverride || state.userAuth?.id || 'u1';
        const newMessage = {
            id: uid(), chat_type: 'coach', user_id: userId, message_type: messageType, content, timestamp: new Date().toISOString(),
            sender_type: senderType, coach_name: coachName
        };
        set(s => ({ chatMessages: [...(s.chatMessages || []), newMessage] }));
    };

    const sendCommunityMessage = (content, messageType = 'text') => {
        const user = state.userAuth || state.clients[0]; // fallback
        if (!user) return;
        const league = state.gamification?.currentLeague || 'none';
        const newMessage = {
            id: uid(), chat_type: 'community', user_id: user.id, username: user.name || 'User', league_badge: league,
            message_type: messageType, content, timestamp: new Date().toISOString()
        };
        set(s => ({ chatMessages: [...(s.chatMessages || []), newMessage] }));
    };

    /* ─── Equipment Confirmation ─── */
    const setConfirmedIncrement = (exerciseId, increment) => {
        set(s => ({ confirmedIncrements: { ...s.confirmedIncrements, [exerciseId]: increment } }));
    };

    /* ─── Client Nutrition Targets (Admin) ─── */
    const updateClientNutritionTargets = (clientId, targets) => {
        set(s => ({
            clients: s.clients.map(c => c.id === clientId ? { ...c, nutritionTargets: { ...c.nutritionTargets, ...targets } } : c),
            // Also sync global nutritionGoals if this is the logged-in user
            ...(s.userAuth?.id === clientId || (!s.userAuth && clientId === 'u1') ? { nutritionGoals: { ...s.nutritionGoals, ...targets } } : {}),
        }));
    };

    /* ─── Shop Packages (Stripe Mock) ─── */
    const purchasePackage = (clientId, pkgType, amount, price) => {
        const orderId = 'pi_' + uid() + uid();
        set(s => {
            const newClients = s.clients.map(c => {
                if (c.id !== clientId) return c;
                const updated = { ...c };
                if (pkgType === 'singola') {
                    updated.credit_singola_total = (updated.credit_singola_total || 0) + amount;
                    updated.credit_singola_remaining = (updated.credit_singola_remaining || 0) + amount;
                } else {
                    updated.credit_coppia_total = (updated.credit_coppia_total || 0) + amount;
                    updated.credit_coppia_remaining = (updated.credit_coppia_remaining || 0) + amount;
                }
                return updated;
            });

            const newOrder = {
                id: orderId, clientId, pkgType, amount, price, date: new Date().toISOString()
            };

            return { clients: newClients, orders: [newOrder, ...s.orders] };
        });
        return orderId;
    };

    const value = {
        state, setState, set,
        LEAGUES,
        // Auth
        adminLogin, adminLogout, userLogin, userRegister, userLogout,
        // Exercises & Videos
        addExercise, updateExercise, deleteExercise, addVideo,
        // Programs
        createProgram, updateProgram, deleteProgram, duplicateProgram, duplicateDay, assignProgramToClient,
        // Nutrition
        addFoodLog, removeFoodLog, updateNutritionGoals,
        // Gamification
        addXP, claimLeagueReward, updateSteps, simulateSteps,
        completeDailyTask, addTimelineEvent,
        startChallenge, uploadProof, claimChallenge, resetDailyChallenges,
        purchaseShopItem,
        rewardPopup, setRewardPopup,
        leaguePopup, setLeaguePopup,
        // Logbook
        updateLogbook, uid,
        // Admin Lessons
        markLessonCompleted, updateLessonStatus, updateClientAvailability, createCoupleLesson, scheduleLesson,
        // Shop
        purchasePackage,
        // Checkins
        submitWorkoutCheckin,
        // Chat
        sendCoachMessage, sendCommunityMessage,
        // Progression Engine
        setConfirmedIncrement,
        // Admin Nutrition
        updateClientNutritionTargets,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useAppContext = () => useContext(AppContext);
