/**
 * CSV Team — High-Precision Progression Recommendation Engine
 * ─────────────────────────────────────────────────────────────
 * Pure logic module. No React imports.
 *
 * EXPORTS:
 *   generateRecommendation(params) → RecommendationResult
 *   inferEquipmentIncrement(history, category) → { increment, confidence }
 *   computeFatigueModifier(stepsToday, stepsHistory) → 'normal' | 'elevated' | 'high'
 *   computeNutritionModifier(adherenceRatio) → 'supportive' | 'slightly_conservative' | 'conservative'
 */

/* ═══════════════════════════════════════════════════
   1. HELPERS
   ═══════════════════════════════════════════════════ */

/**
 * Parse a rep-range string (e.g. "8", "6-12") into { min, max }.
 */
export function parseRepRange(repStr) {
    if (!repStr) return { min: 8, max: 12 };
    const s = String(repStr).trim();
    if (s.includes('-')) {
        const [a, b] = s.split('-').map(Number);
        return { min: a, max: b };
    }
    const n = Number(s);
    return { min: n, max: n };
}

/**
 * Group logbook entries by date and return the latest session's sets.
 */
export function getLastSessionSets(history) {
    if (!history || history.length === 0) return null;
    const grouped = {};
    history.forEach(log => {
        if (!grouped[log.date]) grouped[log.date] = [];
        grouped[log.date].push(log);
    });
    const dates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
    return { date: dates[0], sets: grouped[dates[0]] };
}

/**
 * Get the two most recent distinct sessions.
 */
export function getRecentSessions(history, count = 5) {
    if (!history || history.length === 0) return [];
    const grouped = {};
    history.forEach(log => {
        if (!grouped[log.date]) grouped[log.date] = [];
        grouped[log.date].push(log);
    });
    const dates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
    return dates.slice(0, count).map(d => ({ date: d, sets: grouped[d] }));
}

/* ═══════════════════════════════════════════════════
   2. SET PATTERN ANALYSIS
   ═══════════════════════════════════════════════════ */

/**
 * Classify the quality of a set pattern relative to the prescribed rep range.
 *
 * @param {Array<{weight,reps}>} sets
 * @param {{min,max}} repRange
 * @returns {'strong' | 'moderate' | 'weak'}
 */
export function classifySetPattern(sets, repRange) {
    if (!sets || sets.length === 0) return 'weak';

    const { min, max } = repRange;
    const repsArr = sets.map(s => s.reps);
    const atOrAboveMax = repsArr.filter(r => r >= max).length;
    const belowMin = repsArr.filter(r => r < min).length;
    const total = repsArr.length;

    // Strong: majority at top of range
    if (atOrAboveMax >= Math.ceil(total * 0.6)) return 'strong';

    // Weak: majority below minimum
    if (belowMin >= Math.ceil(total * 0.5)) return 'weak';

    return 'moderate';
}

/* ═══════════════════════════════════════════════════
   3. EQUIPMENT INCREMENT INFERENCE
   ═══════════════════════════════════════════════════ */

const DEFAULT_INCREMENTS = {
    barbell: 2.5,
    dumbbell: 2,
    plate_loaded_machine: 5,
    selectorized_machine: 5,
    cable_machine: 2.5,
    bodyweight: 0,
};

/**
 * Infer the real available load increment from historical weight entries.
 * DESIGN PHILOSOPHY: prefer smart defaults silently. Only flag as 'conflicting'
 * when the data actively contradicts the default (e.g. mixed deltas of 5kg and 8kg).
 * The app should feel like a personal coach, not an AI questionnaire.
 *
 * @param {Array<{weight}>} history — full exercise history
 * @param {string} category — equipment category
 * @returns {{ increment: number, confidence: 'high'|'medium'|'inferred'|'conflicting' }}
 */
export function inferEquipmentIncrement(history, category) {
    const fallback = DEFAULT_INCREMENTS[category] || 2.5;

    if (!history || history.length < 2) {
        // No evidence at all — use the smart default silently
        return { increment: fallback, confidence: 'inferred' };
    }

    // Extract unique weights, sorted ascending
    const uniqueWeights = [...new Set(history.map(h => h.weight))].sort((a, b) => a - b);

    if (uniqueWeights.length < 2) {
        return { increment: fallback, confidence: 'inferred' };
    }

    // Compute deltas between consecutive unique weights
    const deltas = [];
    for (let i = 1; i < uniqueWeights.length; i++) {
        const delta = Math.round((uniqueWeights[i] - uniqueWeights[i - 1]) * 10) / 10;
        if (delta > 0) deltas.push(delta);
    }

    if (deltas.length === 0) {
        return { increment: fallback, confidence: 'inferred' };
    }

    // Find the most frequent delta (mode)
    const freq = {};
    deltas.forEach(d => { freq[d] = (freq[d] || 0) + 1; });
    const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
    const dominantDelta = Number(sorted[0][0]);
    const dominantCount = sorted[0][1];
    const totalDeltas = deltas.length;

    // Confidence scoring — biased toward silent operation
    // High: repeated consistent pattern
    if (dominantCount >= 2 && dominantCount / totalDeltas >= 0.6) {
        return { increment: dominantDelta, confidence: 'high' };
    }

    // Conflicting: multiple equally common deltas (genuinely confusing data)
    if (sorted.length >= 2 && sorted[0][1] === sorted[1][1]) {
        // Use the smallest delta as the safest conservative pick
        const safest = Math.min(dominantDelta, Number(sorted[1][0]));
        return { increment: safest, confidence: 'conflicting' };
    }

    // Medium: some evidence, dominant pattern exists but with few observations
    if (dominantCount >= 1) {
        return { increment: dominantDelta, confidence: 'medium' };
    }

    return { increment: fallback, confidence: 'inferred' };
}

/* ═══════════════════════════════════════════════════
   4. FATIGUE MODIFIER (Steps)
   ═══════════════════════════════════════════════════ */

/**
 * @param {number} stepsToday
 * @param {Array<{date,steps}>} stepsHistory — last 7+ days
 * @returns {'normal' | 'elevated' | 'high'}
 */
export function computeFatigueModifier(stepsToday, stepsHistory) {
    if (!stepsHistory || stepsHistory.length === 0 || !stepsToday) return 'normal';

    const avg = stepsHistory.reduce((sum, d) => sum + d.steps, 0) / stepsHistory.length;
    if (avg === 0) return 'normal';

    const ratio = stepsToday / avg;
    if (ratio > 1.4) return 'high';
    if (ratio > 1.1) return 'elevated';
    return 'normal';
}

/* ═══════════════════════════════════════════════════
   5. NUTRITION MODIFIER
   ═══════════════════════════════════════════════════ */

/**
 * @param {number} adherenceRatio — 0 to 1
 * @returns {'supportive' | 'slightly_conservative' | 'conservative'}
 */
export function computeNutritionModifier(adherenceRatio) {
    if (adherenceRatio == null || adherenceRatio >= 0.9) return 'supportive';
    if (adherenceRatio >= 0.75) return 'slightly_conservative';
    return 'conservative';
}

/* ═══════════════════════════════════════════════════
   6. MAIN RECOMMENDATION GENERATOR
   ═══════════════════════════════════════════════════ */

/**
 * Generate a structured recommendation for the next session.
 *
 * @param {Object} params
 * @param {Array} params.exerciseHistory — all logbook entries
 * @param {string} params.repRangeStr — e.g. "6-12" or "8"
 * @param {number} params.programmedSets
 * @param {string} params.exerciseCategory
 * @param {number|null} params.confirmedIncrement — user-confirmed step
 * @param {number} params.stepsToday
 * @param {Array} params.stepsHistory
 * @param {number} params.nutritionAdherence — 0–1
 * @returns {Object} recommendation
 */
export function generateRecommendation({
    exerciseHistory = [],
    repRangeStr = '8-12',
    programmedSets = 4,
    exerciseCategory = 'barbell',
    confirmedIncrement = null,
    stepsToday = 0,
    stepsHistory = [],
    nutritionAdherence = 1,
}) {
    const repRange = parseRepRange(repRangeStr);
    const lastSession = getLastSessionSets(exerciseHistory);

    // ── No data: baseline request ──
    if (!lastSession) {
        return {
            recommendation_type: 'baseline_needed',
            target_weight: null,
            target_reps: Math.round((repRange.min + repRange.max) / 2),
            confidence_level: 'low',
            equipment_increment_used: null,
            fatigue_modifier: 'normal',
            nutrition_modifier: 'supportive',
            explanation_summary: 'Nessun dato precedente. Esegui una sessione di baseline per avviare il motore di progressione.',
            needs_user_confirmation: false,
            clarification_question: null,
        };
    }

    // ── Equipment increment ──
    let eqResult;
    if (confirmedIncrement != null) {
        eqResult = { increment: confirmedIncrement, confidence: 'high' };
    } else {
        eqResult = inferEquipmentIncrement(exerciseHistory, exerciseCategory);
    }

    // ── Modifiers ──
    const fatigue = computeFatigueModifier(stepsToday, stepsHistory);
    const nutrition = computeNutritionModifier(nutritionAdherence);

    // ── Set pattern analysis ──
    const pattern = classifySetPattern(lastSession.sets, repRange);
    const lastWeight = lastSession.sets[0]?.weight ?? 0;
    const avgReps = Math.round(lastSession.sets.reduce((s, e) => s + e.reps, 0) / lastSession.sets.length);

    // ── Decision logic ──
    let type, targetWeight, targetReps;
    let explanation;
    let needsConfirm = false;
    let clarification = null;

    if (pattern === 'strong') {
        // Strong readiness → consider load increase
        if (fatigue === 'high') {
            type = 'maintain';
            targetWeight = lastWeight;
            targetReps = avgReps;
            explanation = `Performance eccellente, ma la fatica giornaliera è molto alta (passi elevati). Mantieni ${lastWeight} kg e stabilizza le ripetizioni.`;
        } else if (nutrition === 'conservative' && fatigue !== 'normal') {
            type = 'maintain';
            targetWeight = lastWeight;
            targetReps = avgReps;
            explanation = `Performance ottima, ma l\'aderenza nutrizionale è bassa e la fatica è elevata. Stabilizza prima di aumentare.`;
        } else {
            // Proceed with load increase
            if (eqResult.confidence === 'conflicting' && confirmedIncrement == null) {
                // Only ask when data actively contradicts — never for simple lack of data
                type = 'increase_load';
                targetWeight = lastWeight + eqResult.increment;
                targetReps = Math.max(repRange.min, Math.round((repRange.min + repRange.max) / 2));
                needsConfirm = true;
                clarification = getClarificationQuestion(exerciseCategory);
                explanation = `Pronto per aumentare il carico a ${targetWeight} kg. Verifica l'incremento minimo disponibile per questo esercizio.`;
            } else {
                type = 'increase_load';
                targetWeight = lastWeight + eqResult.increment;
                targetReps = Math.max(repRange.min, Math.round((repRange.min + repRange.max) / 2));

                // Apply conservative adjustments
                if (fatigue === 'elevated') {
                    explanation = `Top del range raggiunto. Incremento carico a ${targetWeight} kg (${eqResult.increment} kg step). Fatica leggermente elevata: punta a ${targetReps} reps.`;
                } else if (nutrition === 'slightly_conservative') {
                    explanation = `Top del range raggiunto. Carico aumentato a ${targetWeight} kg. Nutrizione non ottimale: punta a ${targetReps} reps come obiettivo conservativo.`;
                } else {
                    explanation = `Top del range raggiunto su tutte le serie. Incremento carico a ${targetWeight} kg (${eqResult.increment} kg step). Punta a ${targetReps} reps.`;
                }
            }
        }
    } else if (pattern === 'moderate') {
        // Inside range, push reps
        type = 'increase_reps';
        targetWeight = lastWeight;
        targetReps = Math.min(avgReps + 1, repRange.max);

        if (fatigue === 'high') {
            targetReps = avgReps; // don't push
            type = 'maintain';
            explanation = `Buona performance, ma la fatica odierna è alta. Mantieni ${lastWeight} kg × ${targetReps} reps.`;
        } else {
            explanation = `Performance dentro il range. Mantieni ${lastWeight} kg e punta a ${targetReps} reps (progressione di ripetizioni).`;
        }
    } else {
        // Weak pattern — stabilize
        if (avgReps < repRange.min) {
            type = 'stabilize';
            targetWeight = lastWeight;
            targetReps = repRange.min;
            explanation = `Performance sotto il range minimo. Mantieni ${lastWeight} kg e punta ad almeno ${repRange.min} reps prima di progredire.`;
        } else {
            type = 'maintain';
            targetWeight = lastWeight;
            targetReps = avgReps;
            explanation = `Performance debole. Stabilizza ${lastWeight} kg × ${targetReps} reps prima di considerare un aumento.`;
        }
    }

    return {
        recommendation_type: type,
        target_weight: targetWeight,
        target_reps: targetReps,
        confidence_level: eqResult.confidence,
        equipment_increment_used: type === 'increase_load' ? eqResult.increment : null,
        fatigue_modifier: fatigue,
        nutrition_modifier: nutrition,
        explanation_summary: explanation,
        needs_user_confirmation: needsConfirm,
        clarification_question: clarification,
    };
}

/* ═══════════════════════════════════════════════════
   7. CLARIFICATION QUESTIONS
   ═══════════════════════════════════════════════════ */

function getClarificationQuestion(category) {
    switch (category) {
        case 'plate_loaded_machine':
        case 'selectorized_machine':
            return {
                text: 'Qual è il salto di peso minimo su questa macchina?',
                options: [2.5, 5, 8, 10],
                allowCustom: true,
            };
        case 'barbell':
            return {
                text: 'Sono disponibili dischi da 1.25 kg nella tua palestra?',
                options: [{ label: 'Sì (salto 2.5 kg)', value: 2.5 }, { label: 'No (salto 5 kg)', value: 5 }],
                allowCustom: false,
            };
        case 'dumbbell':
            return {
                text: 'Qual è il salto minimo di manubrio disponibile?',
                options: [1, 2, 2.5],
                allowCustom: true,
            };
        case 'cable_machine':
            return {
                text: 'Qual è il salto di peso minimo ai cavi?',
                options: [2.5, 5],
                allowCustom: true,
            };
        default:
            return null;
    }
}
