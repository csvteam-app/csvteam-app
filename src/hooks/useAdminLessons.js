import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useAdminLessons — Hook V2 per il Gestionale Lezioni.
 * 
 * V1: CRUD su coach_availability, coach_availability_overrides,
 *     athlete_availability, lessons, lesson_participants
 *     + Matching deterministico: intersezione fasce orarie
 * 
 * V2: Scoring slot intelligente, Pacchetti & Crediti,
 *     Recupero Buchi, Annullamenti con suggerimenti
 */
export function useAdminLessons() {
    const [coachAvailability, setCoachAvailability] = useState([]);
    const [coachOverrides, setCoachOverrides] = useState([]);
    const [athleteAvailability, setAthleteAvailability] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [athletes, setAthletes] = useState([]);
    const [packages, setPackages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // ─── FETCH ALL ──────────────────────────────────────────
    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        try {
            const [
                { data: coachAvail },
                { data: overrides },
                { data: athleteAvail },
                { data: lessonsData },
                { data: athletesData },
                { data: packagesData }
            ] = await Promise.all([
                supabase.from('coach_availability').select('*').order('day_of_week').order('start_time'),
                supabase.from('coach_availability_overrides').select('*').order('date'),
                supabase.from('athlete_availability').select('*').order('day_of_week').order('start_time'),
                supabase.from('lessons').select(`
                    *,
                    lesson_participants (
                        id,
                        athlete_id,
                        profiles:athlete_id ( id, full_name, avatar_url, email )
                    )
                `).order('date', { ascending: false }).order('start_time', { ascending: false }),
                supabase.from('profiles').select('id, full_name, email, avatar_url').eq('role', 'athlete').order('full_name'),
                supabase.from('lesson_packages').select('*').order('purchased_at', { ascending: false })
            ]);

            setCoachAvailability(coachAvail || []);
            setCoachOverrides(overrides || []);
            setAthleteAvailability(athleteAvail || []);
            setLessons(lessonsData || []);
            setAthletes(athletesData || []);
            setPackages(packagesData || []);
        } catch (err) {
            console.error('useAdminLessons fetchAll error:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ─── COACH AVAILABILITY CRUD ────────────────────────────

    const saveCoachAvailability = async (coachId, slots) => {
        const { error: delErr } = await supabase
            .from('coach_availability')
            .delete()
            .eq('coach_id', coachId);
        if (delErr) { console.error(delErr); return false; }

        if (slots.length === 0) { await fetchAll(); return true; }

        const rows = slots.map(s => ({
            coach_id: coachId,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            is_break: s.is_break || false,
            lesson_type_preference: s.lesson_type_preference || 'both'
        }));

        const { error } = await supabase.from('coach_availability').insert(rows);
        if (error) { console.error(error); return false; }
        await fetchAll();
        return true;
    };

    // ─── COACH OVERRIDES ────────────────────────────────────

    const saveCoachOverride = async (coachId, date, available, startTime = null, endTime = null, reason = null) => {
        const { error } = await supabase
            .from('coach_availability_overrides')
            .upsert({
                coach_id: coachId,
                date,
                available,
                start_time: startTime,
                end_time: endTime,
                reason
            }, { onConflict: 'coach_id,date' });
        if (error) { console.error(error); return false; }
        await fetchAll();
        return true;
    };

    const deleteCoachOverride = async (id) => {
        const { error } = await supabase.from('coach_availability_overrides').delete().eq('id', id);
        if (!error) await fetchAll();
    };

    // ─── ATHLETE AVAILABILITY CRUD ──────────────────────────

    const saveAthleteAvailability = async (athleteId, slots) => {
        const { error: delErr } = await supabase
            .from('athlete_availability')
            .delete()
            .eq('athlete_id', athleteId);
        if (delErr) { console.error(delErr); return false; }

        if (slots.length === 0) { await fetchAll(); return true; }

        const rows = slots.map(s => ({
            athlete_id: athleteId,
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            prefers_pair: s.prefers_pair || false
        }));

        const { error } = await supabase.from('athlete_availability').insert(rows);
        if (error) { console.error(error); return false; }
        await fetchAll();
        return true;
    };

    // ═══════════════════════════════════════════════════════════
    // V2 — PACCHETTI & CREDITI
    // ═══════════════════════════════════════════════════════════

    const createPackage = async ({ athleteId, packageType, totalCredits, expiresAt = null, notes = null }) => {
        const { data, error } = await supabase
            .from('lesson_packages')
            .insert({
                athlete_id: athleteId,
                package_type: packageType,
                total_credits: totalCredits,
                expires_at: expiresAt,
                notes
            })
            .select()
            .single();
        if (error) { console.error(error); return { error: error.message }; }
        await fetchAll();
        return { data };
    };

    const deletePackage = async (pkgId) => {
        const { error } = await supabase.from('lesson_packages').delete().eq('id', pkgId);
        if (!error) await fetchAll();
    };

    /** Trova pacchetto attivo con crediti disponibili per un atleta */
    const getActivePackage = (athleteId, lessonType) => {
        const now = new Date().toISOString();
        return packages.find(p =>
            p.athlete_id === athleteId &&
            p.package_type === lessonType &&
            p.used_credits < p.total_credits &&
            (!p.expires_at || p.expires_at > now)
        );
    };

    /** Crediti rimanenti per atleta (somma di tutti i pacchetti attivi) */
    const getRemainingCredits = (athleteId) => {
        const now = new Date().toISOString();
        const active = packages.filter(p =>
            p.athlete_id === athleteId &&
            p.used_credits < p.total_credits &&
            (!p.expires_at || p.expires_at > now)
        );
        return {
            single: active.filter(p => p.package_type === 'single').reduce((acc, p) => acc + (p.total_credits - p.used_credits), 0),
            pair: active.filter(p => p.package_type === 'pair').reduce((acc, p) => acc + (p.total_credits - p.used_credits), 0),
            total: active.reduce((acc, p) => acc + (p.total_credits - p.used_credits), 0)
        };
    };

    /** Decrementa crediti di un pacchetto (chiamata automatica dopo createLesson) */
    const _decrementCredit = async (athleteId, lessonType) => {
        const pkg = getActivePackage(athleteId, lessonType);
        if (!pkg) return; // Nessun pacchetto attivo

        const { error } = await supabase
            .from('lesson_packages')
            .update({ used_credits: pkg.used_credits + 1 })
            .eq('id', pkg.id);

        if (error) console.error('Credit decrement error:', error);
    };

    // ─── LESSONS CRUD ───────────────────────────────────────

    const createLesson = async ({ coachId, lessonType, date, startTime, endTime, durationMinutes, athleteIds, notes }) => {
        // 1. Insert lezione
        const { data: lesson, error: lessonErr } = await supabase
            .from('lessons')
            .insert({
                coach_id: coachId,
                lesson_type: lessonType,
                date,
                start_time: startTime,
                end_time: endTime,
                duration_minutes: durationMinutes,
                status: 'scheduled',
                notes
            })
            .select()
            .single();

        if (lessonErr) {
            console.error('createLesson error:', lessonErr);
            if (lessonErr.message?.includes('CONFLICT')) {
                return { error: 'Conflitto: questa lezione si sovrappone con una già esistente.' };
            }
            return { error: lessonErr.message };
        }

        // 2. Insert partecipanti
        const participants = athleteIds.map(aid => ({
            lesson_id: lesson.id,
            athlete_id: aid
        }));

        const { error: partErr } = await supabase.from('lesson_participants').insert(participants);
        if (partErr) {
            console.error('lesson_participants insert error:', partErr);
            await supabase.from('lessons').delete().eq('id', lesson.id);
            return { error: partErr.message };
        }

        // 3. V2: Decrementa crediti automaticamente per ogni partecipante
        for (const aid of athleteIds) {
            await _decrementCredit(aid, lessonType);
        }

        await fetchAll();
        return { data: lesson };
    };

    const updateLessonStatus = async (lessonId, status) => {
        const updateData = { status };
        if (status === 'cancelled') {
            updateData.cancelled_at = new Date().toISOString();
        }

        const { error } = await supabase.from('lessons').update(updateData).eq('id', lessonId);
        if (error) { console.error(error); return false; }

        setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, ...updateData } : l));
        return true;
    };

    const deleteLesson = async (lessonId) => {
        const { error } = await supabase.from('lessons').delete().eq('id', lessonId);
        if (!error) {
            setLessons(prev => prev.filter(l => l.id !== lessonId));
        }
    };

    // ═══════════════════════════════════════════════════════════
    // V2 — ANNULLAMENTO INTELLIGENTE + RECUPERO BUCHI
    // ═══════════════════════════════════════════════════════════

    /**
     * Annulla una lezione e suggerisce chi potrebbe riempire lo slot liberato.
     * @returns {{ suggestions: Array<{athlete, score}> }}
     */
    const cancelAndSuggest = async (lessonId) => {
        const lesson = lessons.find(l => l.id === lessonId);
        if (!lesson) return { suggestions: [] };

        // 1. Annulla la lezione
        await updateLessonStatus(lessonId, 'cancelled');

        // 2. Trova chi potrebbe riempire lo slot liberato
        const suggestions = findGapFillers(
            lesson.coach_id,
            lesson.date,
            lesson.start_time,
            lesson.end_time,
            lesson.lesson_type
        );

        return { suggestions };
    };

    /**
     * Trova atleti che possono riempire un buco specifico nell'agenda del coach.
     * Utile sia all'annullamento sia per l'analisi proattiva dei buchi.
     */
    const findGapFillers = (coachId, date, startTime, endTime, lessonType = 'single') => {
        const d = new Date(date);
        const jsDay = d.getDay();
        const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
        const gapStart = timeToMinutes(startTime);
        const gapEnd = timeToMinutes(endTime);

        const candidates = [];

        for (const athlete of athletes) {
            // Escludi atleti che hanno già lezioni in questo orario
            const hasConflict = lessons.some(l =>
                l.date === date &&
                l.status === 'scheduled' &&
                l.lesson_participants?.some(lp => lp.athlete_id === athlete.id) &&
                overlaps(startTime, endTime, l.start_time, l.end_time)
            );
            if (hasConflict) continue;

            // L'atleta ha disponibilità che copre lo slot?
            const athleteSlots = athleteAvailability.filter(
                aa => aa.athlete_id === athlete.id && aa.day_of_week === dayOfWeek
            );

            const covers = athleteSlots.some(as =>
                timeToMinutes(as.start_time) <= gapStart &&
                timeToMinutes(as.end_time) >= gapEnd
            );

            if (!covers) continue;

            // Se lezione di coppia, serve che preferisca coppia
            if (lessonType === 'pair') {
                const prefersPair = athleteSlots.some(as => as.prefers_pair);
                if (!prefersPair) continue;
            }

            // Punteggio priorità: chi ha crediti attivi ha più peso
            const credits = getRemainingCredits(athlete.id);
            const typeCredits = lessonType === 'single' ? credits.single : credits.pair;

            candidates.push({
                athlete,
                score: typeCredits > 0 ? 100 : 50,
                credits: typeCredits
            });
        }

        return candidates.sort((a, b) => b.score - a.score);
    };

    /**
     * V2: Analizza l'agenda del coach e individua buchi (gap inutilizzati).
     * Restituisce array di { date, start_time, end_time, duration, fillers[] }.
     */
    const analyzeGaps = (coachId, startDate, endDate) => {
        const gaps = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const jsDay = d.getDay();
            const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

            // Override check
            const override = coachOverrides.find(o => o.coach_id === coachId && o.date === dateStr);
            if (override && !override.available) continue;

            // Fasce coach
            let coachSlots;
            if (override && override.available && override.start_time) {
                coachSlots = [{ start_time: override.start_time, end_time: override.end_time }];
            } else {
                coachSlots = coachAvailability
                    .filter(ca => ca.coach_id === coachId && ca.day_of_week === dayOfWeek && !ca.is_break && (ca.lesson_type_preference === 'both' || ca.lesson_type_preference === 'pair'))
                    .map(ca => ({ start_time: ca.start_time, end_time: ca.end_time }));
            }

            // Lezioni del giorno
            const dayLessons = lessons
                .filter(l => l.coach_id === coachId && l.date === dateStr && l.status === 'scheduled')
                .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

            // Per ogni fascia coach, trova buchi tra le lezioni
            for (const cs of coachSlots) {
                const csStart = timeToMinutes(cs.start_time);
                const csEnd = timeToMinutes(cs.end_time);

                // Lezioni dentro questa fascia del coach
                const slotLessons = dayLessons.filter(l =>
                    timeToMinutes(l.start_time) >= csStart && timeToMinutes(l.end_time) <= csEnd
                );

                if (slotLessons.length === 0) {
                    // L'intera fascia è vuota
                    if (csEnd - csStart >= 30) {
                        const fillers = findGapFillers(coachId, dateStr, cs.start_time, cs.end_time);
                        gaps.push({
                            date: dateStr,
                            day_of_week: dayOfWeek,
                            start_time: cs.start_time,
                            end_time: cs.end_time,
                            duration: csEnd - csStart,
                            fillers
                        });
                    }
                    continue;
                }

                // Buco prima della prima lezione
                const firstLessonStart = timeToMinutes(slotLessons[0].start_time);
                if (firstLessonStart - csStart >= 30) {
                    const gapStartT = cs.start_time;
                    const gapEndT = slotLessons[0].start_time;
                    gaps.push({
                        date: dateStr, day_of_week: dayOfWeek,
                        start_time: gapStartT, end_time: gapEndT,
                        duration: firstLessonStart - csStart,
                        fillers: findGapFillers(coachId, dateStr, gapStartT, gapEndT)
                    });
                }

                // Buchi tra lezioni consecutive
                for (let i = 0; i < slotLessons.length - 1; i++) {
                    const gapStartMin = timeToMinutes(slotLessons[i].end_time);
                    const gapEndMin = timeToMinutes(slotLessons[i + 1].start_time);
                    if (gapEndMin - gapStartMin >= 30) {
                        const gapStartT = slotLessons[i].end_time;
                        const gapEndT = slotLessons[i + 1].start_time;
                        gaps.push({
                            date: dateStr, day_of_week: dayOfWeek,
                            start_time: gapStartT, end_time: gapEndT,
                            duration: gapEndMin - gapStartMin,
                            fillers: findGapFillers(coachId, dateStr, gapStartT, gapEndT)
                        });
                    }
                }

                // Buco dopo l'ultima lezione
                const lastLessonEnd = timeToMinutes(slotLessons[slotLessons.length - 1].end_time);
                if (csEnd - lastLessonEnd >= 30) {
                    const gapStartT = slotLessons[slotLessons.length - 1].end_time;
                    const gapEndT = cs.end_time;
                    gaps.push({
                        date: dateStr, day_of_week: dayOfWeek,
                        start_time: gapStartT, end_time: gapEndT,
                        duration: csEnd - lastLessonEnd,
                        fillers: findGapFillers(coachId, dateStr, gapStartT, gapEndT)
                    });
                }
            }
        }

        return gaps;
    };

    // ═══════════════════════════════════════════════════════════
    // MATCHING DETERMINISTICO (V1) + SCORING INTELLIGENTE (V2)
    // ═══════════════════════════════════════════════════════════

    /**
     * Trova gli slot disponibili comuni tra il coach e uno o più atleti.
     * V2: Ogni slot ha uno score aggiuntivo per l'ordinamento.
     */
    const findAvailableSlots = (coachId, athleteIds, startDate, endDate, durationMinutes = 60) => {
        const results = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const jsDay = d.getDay();
            const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

            // 1. Check override
            const override = coachOverrides.find(o => o.coach_id === coachId && o.date === dateStr);
            if (override && !override.available) continue;

            // 2. Fasce orarie del coach
            let coachSlots;
            if (override && override.available && override.start_time) {
                coachSlots = [{ start_time: override.start_time, end_time: override.end_time }];
            } else {
                const reqLessonType = athleteIds.length > 1 ? 'pair' : 'single';
                coachSlots = coachAvailability
                    .filter(ca => ca.coach_id === coachId && ca.day_of_week === dayOfWeek && !ca.is_break && (ca.lesson_type_preference === 'both' || ca.lesson_type_preference === reqLessonType))
                    .map(ca => ({ start_time: ca.start_time, end_time: ca.end_time }));
            }

            if (coachSlots.length === 0) continue;

            // 3. Pause coach
            const coachBreaks = coachAvailability
                .filter(ca => ca.coach_id === coachId && ca.day_of_week === dayOfWeek && ca.is_break);

            // 4. Fasce atleti
            const athleteSlotSets = athleteIds.map(aid =>
                athleteAvailability
                    .filter(aa => aa.athlete_id === aid && aa.day_of_week === dayOfWeek)
                    .map(aa => ({ start_time: aa.start_time, end_time: aa.end_time }))
            );

            if (athleteSlotSets.some(set => set.length === 0)) continue;

            // 5. Lezioni coach esistenti
            const existingCoachLessons = lessons
                .filter(l => l.coach_id === coachId && l.date === dateStr && l.status === 'scheduled');

            // 6. Lezioni atleti esistenti
            const existingAthleteLessons = athleteIds.map(aid =>
                lessons.filter(l =>
                    l.date === dateStr &&
                    l.status === 'scheduled' &&
                    l.lesson_participants?.some(lp => lp.athlete_id === aid)
                )
            );

            // 7. Genera slot
            const slotDuration = durationMinutes;
            const stepMinutes = 30;

            for (const coachSlot of coachSlots) {
                const csStart = timeToMinutes(coachSlot.start_time);
                const csEnd = timeToMinutes(coachSlot.end_time);

                for (let t = csStart; t + slotDuration <= csEnd; t += stepMinutes) {
                    const slotStart = minutesToTime(t);
                    const slotEnd = minutesToTime(t + slotDuration);

                    if (coachBreaks.some(b => overlaps(slotStart, slotEnd, b.start_time, b.end_time))) continue;
                    if (existingCoachLessons.some(l => overlaps(slotStart, slotEnd, l.start_time, l.end_time))) continue;

                    let allAthletesOk = true;
                    for (let ai = 0; ai < athleteIds.length; ai++) {
                        const athleteCovers = athleteSlotSets[ai].some(as =>
                            timeToMinutes(as.start_time) <= t && timeToMinutes(as.end_time) >= t + slotDuration
                        );
                        if (!athleteCovers) { allAthletesOk = false; break; }
                        if (existingAthleteLessons[ai].some(l => overlaps(slotStart, slotEnd, l.start_time, l.end_time))) {
                            allAthletesOk = false; break;
                        }
                    }

                    if (allAthletesOk) {
                        // V2: Calcola punteggio intelligente per questo slot
                        const score = _scoreSlot(coachId, dateStr, t, slotDuration, existingCoachLessons, csStart, csEnd);

                        results.push({
                            date: dateStr,
                            day_of_week: dayOfWeek,
                            start_time: slotStart,
                            end_time: slotEnd,
                            score
                        });
                    }
                }
            }
        }

        // V2: Ordina per score decrescente (lo slot migliore in cima)
        return results.sort((a, b) => b.score - a.score);
    };

    // ═══════════════════════════════════════════════════════════
    // V2 — SCORING SLOT INTELLIGENTE
    // ═══════════════════════════════════════════════════════════

    /**
     * Assegna un punteggio a uno slot candidato.
     * 
     * TABELLA PUNTEGGI:
     * +50  Riempie un buco tra 2 lezioni esistenti
     * +30  Adiacente a una lezione esistente (prima o dopo)
     * +20  Slot in fascia preferita (mattina 9-12 o pomeriggio 16-19)
     * +10  Slot nella prima metà della giornata (efficienza agenda)
     * -20  Lascia un piccolo buco inutile (< 30 min)
     * -30  Spezza male la giornata (crea gap isolato > 90 min)
     */
    const _scoreSlot = (coachId, dateStr, slotStartMin, durationMin, existingLessons, coachBlockStart, coachBlockEnd) => {
        let score = 0;
        const slotEndMin = slotStartMin + durationMin;

        // Lezioni ordinate per questo giorno
        const dayLessons = existingLessons
            .filter(l => l.status === 'scheduled')
            .map(l => ({ start: timeToMinutes(l.start_time), end: timeToMinutes(l.end_time) }))
            .sort((a, b) => a.start - b.start);

        if (dayLessons.length > 0) {
            // Check: riempie un buco tra due lezioni?
            for (let i = 0; i < dayLessons.length - 1; i++) {
                const gapStart = dayLessons[i].end;
                const gapEnd = dayLessons[i + 1].start;
                if (slotStartMin >= gapStart && slotEndMin <= gapEnd) {
                    // Riempie esattamente il buco
                    if (Math.abs(slotEndMin - slotStartMin - (gapEnd - gapStart)) < 15) {
                        score += 50; // Riempimento perfetto
                    } else {
                        score += 30; // Riempimento parziale
                    }
                }
            }

            // Check: adiacente a una lezione (touching)?
            const isAdjacentBefore = dayLessons.some(l => l.end === slotStartMin);
            const isAdjacentAfter = dayLessons.some(l => l.start === slotEndMin);
            if (isAdjacentBefore && isAdjacentAfter) score += 40; // Tra due lezioni contigue
            else if (isAdjacentBefore || isAdjacentAfter) score += 30;

            // Penalità: crea un piccolo buco inutile (< 30 min)?
            const wouldCreateSmallGapBefore = dayLessons.some(l => {
                const gap = slotStartMin - l.end;
                return gap > 0 && gap < 30;
            });
            const wouldCreateSmallGapAfter = dayLessons.some(l => {
                const gap = l.start - slotEndMin;
                return gap > 0 && gap < 30;
            });
            if (wouldCreateSmallGapBefore) score -= 20;
            if (wouldCreateSmallGapAfter) score -= 20;
        }

        // Bonus: fascia oraria preferita
        const hour = Math.floor(slotStartMin / 60);
        if ((hour >= 9 && hour < 12) || (hour >= 16 && hour < 19)) {
            score += 20; // Fasce prime (mattina/pomeriggio)
        }

        // Bonus minore: prima metà della giornata del coach (efficienza)
        const coachMidpoint = (coachBlockStart + coachBlockEnd) / 2;
        if (slotStartMin < coachMidpoint) score += 10;

        // Penalità: slot isolato che spezza la giornata
        if (dayLessons.length > 0) {
            const nearestLesson = dayLessons.reduce((best, l) => {
                const dist = Math.min(Math.abs(l.end - slotStartMin), Math.abs(l.start - slotEndMin));
                return dist < best ? dist : best;
            }, Infinity);
            if (nearestLesson > 90) score -= 30; // Gap isolato > 1.5h
        }

        return score;
    };

    /**
     * Trova coppie compatibili tra tutti gli atleti con prefers_pair = true.
     * V2: Include score di compatibilità migliorato.
     */
    const findCompatiblePairs = (coachId) => {
        const pairAthletes = athletes.filter(a => {
            const avail = athleteAvailability.filter(aa => aa.athlete_id === a.id && aa.prefers_pair);
            return avail.length > 0;
        });

        const pairs = [];
        for (let i = 0; i < pairAthletes.length; i++) {
            for (let j = i + 1; j < pairAthletes.length; j++) {
                const a1 = pairAthletes[i];
                const a2 = pairAthletes[j];

                const now = new Date();
                const twoWeeks = new Date(now);
                twoWeeks.setDate(twoWeeks.getDate() + 14);

                const commonSlots = findAvailableSlots(
                    coachId,
                    [a1.id, a2.id],
                    now.toISOString().split('T')[0],
                    twoWeeks.toISOString().split('T')[0],
                    60
                );

                if (commonSlots.length > 0) {
                    const uniqueDays = new Set(commonSlots.map(s => s.day_of_week));
                    // V2: Score migliorato basato anche sui crediti disponibili
                    const c1 = getRemainingCredits(a1.id);
                    const c2 = getRemainingCredits(a2.id);
                    const creditBonus = (c1.pair > 0 && c2.pair > 0) ? 15 : 0;
                    const avgScore = commonSlots.reduce((acc, s) => acc + (s.score || 0), 0) / commonSlots.length;

                    pairs.push({
                        athlete1: a1,
                        athlete2: a2,
                        commonSlotCount: commonSlots.length,
                        commonDays: uniqueDays.size,
                        compatibility: Math.min(100, Math.round((commonSlots.length / 14) * 100) + creditBonus),
                        avgSlotScore: Math.round(avgScore),
                        credits: { a1: c1, a2: c2 },
                        slots: commonSlots
                    });
                }
            }
        }

        return pairs.sort((a, b) => b.commonSlotCount - a.commonSlotCount);
    };

    // ═══════════════════════════════════════════════════════════
    // V3 — AI ASSISTANT FUNCTIONS (per OpenAI Function Calling)
    // ═══════════════════════════════════════════════════════════

    /**
     * Registry delle funzioni disponibili per l'AI Assistant.
     * Ogni funzione ha nome, descrizione, parametri (JSON Schema) e handler.
     */
    const aiFunctions = [
        {
            name: 'find_available_slots',
            description: 'Trova slot disponibili per una lezione tra il coach e uno o più atleti in un range di date.',
            parameters: {
                type: 'object',
                properties: {
                    athlete_names: { type: 'array', items: { type: 'string' }, description: 'Nomi degli atleti' },
                    start_date: { type: 'string', description: 'Data inizio (YYYY-MM-DD). Default: oggi.' },
                    end_date: { type: 'string', description: 'Data fine (YYYY-MM-DD). Default: +14 giorni.' },
                    duration_minutes: { type: 'number', description: 'Durata lezione in minuti. Default: 60.' }
                },
                required: ['athlete_names']
            },
            handler: (args, coachId) => {
                const athleteIds = _resolveAthleteNames(args.athlete_names);
                if (athleteIds.length === 0) return { error: 'Nessun atleta trovato con quei nomi.' };

                const today = new Date().toISOString().split('T')[0];
                const twoWeeks = new Date(); twoWeeks.setDate(twoWeeks.getDate() + 14);

                const slots = findAvailableSlots(
                    coachId,
                    athleteIds,
                    args.start_date || today,
                    args.end_date || twoWeeks.toISOString().split('T')[0],
                    args.duration_minutes || 60
                );

                return {
                    slots_found: slots.length,
                    best_slots: slots.slice(0, 5).map(s => ({
                        date: s.date,
                        start: s.start_time,
                        end: s.end_time,
                        score: s.score
                    }))
                };
            }
        },
        {
            name: 'find_compatible_pairs',
            description: 'Trova coppie di atleti compatibili per lezioni di coppia.',
            parameters: { type: 'object', properties: {}, required: [] },
            handler: (_args, coachId) => {
                const pairs = findCompatiblePairs(coachId);
                return {
                    pairs_found: pairs.length,
                    top_pairs: pairs.slice(0, 5).map(p => ({
                        athletes: `${p.athlete1.full_name} + ${p.athlete2.full_name}`,
                        compatibility: p.compatibility + '%',
                        common_slots: p.commonSlotCount,
                        best_slot: p.slots[0] ? `${p.slots[0].date} ${p.slots[0].start_time}` : 'N/A'
                    }))
                };
            }
        },
        {
            name: 'analyze_weekly_gaps',
            description: 'Analizza i buchi nell\'agenda del coach per la settimana corrente o un range di date. Suggerisce chi può riempirli.',
            parameters: {
                type: 'object',
                properties: {
                    start_date: { type: 'string', description: 'Data inizio analisi (YYYY-MM-DD).' },
                    end_date: { type: 'string', description: 'Data fine analisi (YYYY-MM-DD).' }
                },
                required: []
            },
            handler: (args, coachId) => {
                const today = new Date().toISOString().split('T')[0];
                const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
                const gaps = analyzeGaps(coachId, args.start_date || today, args.end_date || weekEnd.toISOString().split('T')[0]);
                return {
                    gaps_found: gaps.length,
                    gaps: gaps.slice(0, 10).map(g => ({
                        date: g.date,
                        slot: `${g.start_time} - ${g.end_time}`,
                        duration_min: g.duration,
                        candidates: g.fillers.slice(0, 3).map(f => f.athlete.full_name)
                    }))
                };
            }
        },
        {
            name: 'create_lesson',
            description: 'Crea una nuova lezione prenotata per il coach.',
            parameters: {
                type: 'object',
                properties: {
                    athlete_names: { type: 'array', items: { type: 'string' }, description: 'Nomi degli atleti partecipanti.' },
                    date: { type: 'string', description: 'Data della lezione (YYYY-MM-DD).' },
                    start_time: { type: 'string', description: 'Orario inizio (HH:MM).' },
                    end_time: { type: 'string', description: 'Orario fine (HH:MM).' },
                    lesson_type: { type: 'string', enum: ['single', 'pair'], description: 'Tipo lezione.' },
                    notes: { type: 'string', description: 'Note opzionali.' }
                },
                required: ['athlete_names', 'date', 'start_time']
            },
            handler: async (args, coachId) => {
                const athleteIds = _resolveAthleteNames(args.athlete_names);
                if (athleteIds.length === 0) return { error: 'Nessun atleta trovato.' };

                const startMin = timeToMinutes(args.start_time);
                const endT = args.end_time || minutesToTime(startMin + 60);
                const duration = timeToMinutes(endT) - startMin;
                const type = args.lesson_type || (athleteIds.length > 1 ? 'pair' : 'single');

                const result = await createLesson({
                    coachId,
                    lessonType: type,
                    date: args.date,
                    startTime: args.start_time,
                    endTime: endT,
                    durationMinutes: duration,
                    athleteIds,
                    notes: args.notes || null
                });

                if (result.error) return { error: result.error };
                return { success: true, lesson_id: result.data.id, message: 'Lezione creata con successo!' };
            }
        },
        {
            name: 'cancel_lesson',
            description: 'Annulla una lezione e suggerisce sostituzioni per lo slot liberato.',
            parameters: {
                type: 'object',
                properties: {
                    athlete_name: { type: 'string', description: 'Nome dell\'atleta della lezione da annullare.' },
                    date: { type: 'string', description: 'Data della lezione (YYYY-MM-DD).' }
                },
                required: ['athlete_name', 'date']
            },
            handler: async (args, coachId) => {
                const lesson = lessons.find(l =>
                    l.coach_id === coachId &&
                    l.date === args.date &&
                    l.status === 'scheduled' &&
                    l.lesson_participants?.some(lp =>
                        lp.profiles?.full_name?.toLowerCase().includes(args.athlete_name.toLowerCase())
                    )
                );
                if (!lesson) return { error: 'Lezione non trovata per questo atleta in questa data.' };

                const { suggestions } = await cancelAndSuggest(lesson.id);
                return {
                    cancelled: true,
                    freed_slot: `${lesson.date} ${lesson.start_time}-${lesson.end_time}`,
                    replacement_candidates: suggestions.slice(0, 3).map(s => ({
                        name: s.athlete.full_name,
                        credits: s.credits
                    }))
                };
            }
        },
        {
            name: 'get_athlete_credits',
            description: 'Mostra i crediti lezione rimanenti per un atleta.',
            parameters: {
                type: 'object',
                properties: {
                    athlete_name: { type: 'string', description: 'Nome dell\'atleta.' }
                },
                required: ['athlete_name']
            },
            handler: (args) => {
                const athlete = athletes.find(a =>
                    a.full_name?.toLowerCase().includes(args.athlete_name.toLowerCase())
                );
                if (!athlete) return { error: 'Atleta non trovato.' };
                const credits = getRemainingCredits(athlete.id);
                return { athlete: athlete.full_name, credits };
            }
        },
        {
            name: 'reschedule_lesson',
            description: 'Sposta una lezione trovando nuovi slot disponibili.',
            parameters: {
                type: 'object',
                properties: {
                    athlete_name: { type: 'string', description: 'Nome dell\'atleta.' },
                    date: { type: 'string', description: 'Data attuale della lezione (YYYY-MM-DD).' }
                },
                required: ['athlete_name', 'date']
            },
            handler: (args, coachId) => {
                const lesson = lessons.find(l =>
                    l.coach_id === coachId &&
                    l.date === args.date &&
                    l.status === 'scheduled' &&
                    l.lesson_participants?.some(lp =>
                        lp.profiles?.full_name?.toLowerCase().includes(args.athlete_name.toLowerCase())
                    )
                );
                if (!lesson) return { error: 'Lezione non trovata.' };

                const athleteIds = lesson.lesson_participants.map(lp => lp.athlete_id);
                const today = new Date().toISOString().split('T')[0];
                const twoWeeks = new Date(); twoWeeks.setDate(twoWeeks.getDate() + 14);

                const alternatives = findAvailableSlots(
                    coachId,
                    athleteIds,
                    today,
                    twoWeeks.toISOString().split('T')[0],
                    lesson.duration_minutes
                );

                return {
                    current: `${lesson.date} ${lesson.start_time}-${lesson.end_time}`,
                    alternatives: alternatives.slice(0, 5).map(s => ({
                        date: s.date,
                        start: s.start_time,
                        end: s.end_time,
                        score: s.score
                    }))
                };
            }
        }
    ];

    /** Risolve nomi atleta in IDs (fuzzy match) */
    const _resolveAthleteNames = (names) => {
        return names
            .map(name => athletes.find(a => a.full_name?.toLowerCase().includes(name.toLowerCase())))
            .filter(Boolean)
            .map(a => a.id);
    };

    /**
     * V3: Chiama l'AI Assistant con un prompt utente.
     * Usa OpenAI Function Calling per orchestrare le funzioni deterministiche.
     */
    const askAI = async (userMessage, coachId) => {
        const openAiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!openAiKey) return { error: 'Chiave OpenAI non configurata.' };

        // Prepara le tools per OpenAI
        const tools = aiFunctions.map(fn => ({
            type: 'function',
            function: {
                name: fn.name,
                description: fn.description,
                parameters: fn.parameters
            }
        }));

        const systemPrompt = `Sei l'assistente intelligente per il gestionale lezioni di un coach di bodybuilding.
Hai accesso a funzioni per cercare slot, creare lezioni, annullare lezioni, trovare coppie compatibili, analizzare buchi nell'agenda, controllare crediti e spostare lezioni.
Rispondi SEMPRE in italiano, in modo conciso e professionale.
Quando l'utente chiede di trovare slot o creare lezioni, usa le funzioni appropriate.
Quando suggerisci slot, indica data, orario e punteggio di ottimizzazione.
Se qualcosa non è possibile, spiega il motivo e proponi alternative.
Data di oggi: ${new Date().toISOString().split('T')[0]}.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
        ];

        try {
            // Prima chiamata: il modello decide se usare funzioni
            let response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openAiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages,
                    tools,
                    tool_choice: 'auto',
                    temperature: 0.3
                })
            });

            let data = await response.json();
            if (data.error) return { error: data.error.message };

            let assistantMessage = data.choices?.[0]?.message;
            if (!assistantMessage) return { error: 'Risposta AI vuota.' };

            // Loop: gestisci function calls (possono essere multipli in sequenza)
            let iterations = 0;
            while (assistantMessage.tool_calls && iterations < 5) {
                iterations++;
                messages.push(assistantMessage);

                for (const toolCall of assistantMessage.tool_calls) {
                    const fn = aiFunctions.find(f => f.name === toolCall.function.name);
                    if (!fn) {
                        messages.push({ role: 'tool', tool_call_id: toolCall.id, content: JSON.stringify({ error: 'Function not found' }) });
                        continue;
                    }

                    let args;
                    try { args = JSON.parse(toolCall.function.arguments); } catch { args = {}; }

                    const result = await fn.handler(args, coachId);
                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        content: JSON.stringify(result)
                    });
                }

                // Richiama il modello con i risultati delle funzioni
                response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${openAiKey}`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages,
                        tools,
                        tool_choice: 'auto',
                        temperature: 0.3
                    })
                });

                data = await response.json();
                if (data.error) return { error: data.error.message };
                assistantMessage = data.choices?.[0]?.message;
                if (!assistantMessage) return { error: 'Risposta AI vuota dopo function call.' };
            }

            return { response: assistantMessage.content };

        } catch (err) {
            console.error('AI Assistant error:', err);
            return { error: 'Errore di rete con l\'assistente AI.' };
        }
    };

    // ─── RETURN ─────────────────────────────────────────────

    return {
        // Data
        coachAvailability,
        coachOverrides,
        athleteAvailability,
        lessons,
        athletes,
        packages,
        isLoading,

        // V1 Actions
        refresh: fetchAll,
        saveCoachAvailability,
        saveCoachOverride,
        deleteCoachOverride,
        saveAthleteAvailability,
        createLesson,
        updateLessonStatus,
        deleteLesson,

        // V1 Matching
        findAvailableSlots,
        findCompatiblePairs,

        // V2 Packages & Credits
        createPackage,
        deletePackage,
        getActivePackage,
        getRemainingCredits,

        // V2 Gap Recovery & Cancellations
        cancelAndSuggest,
        findGapFillers,
        analyzeGaps,

        // V3 AI Assistant
        askAI,
        aiFunctions,
    };
}


// ─── HELPER FUNCTIONS (pure, no side effects) ──────────────

/** "09:30" → 570 */
function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

/** 570 → "09:30" */
function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/** Verifica se due intervalli [s1,e1) e [s2,e2) si sovrappongono */
function overlaps(s1, e1, s2, e2) {
    const a1 = timeToMinutes(s1), b1 = timeToMinutes(e1);
    const a2 = timeToMinutes(s2), b2 = timeToMinutes(e2);
    return a1 < b2 && a2 < b1;
}


