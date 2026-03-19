/**
 * Feature Flags — Launch Light Mode
 * 
 * Per riattivare una funzionalità, cambia il flag da `false` a `true`.
 * Nessun codice è stato eliminato: i flag controllano sia la UI che la logica
 * (fetch, useEffect, subscription, overlay).
 * 
 * APP_MODE: "launch_light" = solo core features attive
 *           "full"         = tutte le features attive
 */

export const APP_MODE = 'launch_light';

const isLight = APP_MODE === 'launch_light';

const FEATURE_FLAGS = {
    /** CSV Games, leaderboard, challenge */
    GAMES: !isLight,

    /** XP system, livelli, lega */
    XP: !isLight,

    /** Streak giornaliere */
    STREAK: !isLight,

    /** Progress tracking avanzato (statistiche, progressi automatici) */
    PROGRESS: !isLight,

    /** Premi, reward system, overlay animazioni */
    REWARDS: !isLight,

    /** AI contacalorie vocale (VoiceLoggerModal) */
    VOICE_AI: !isLight,

    /** Daily tasks / daily progress card nella Dashboard */
    DAILY_TASKS: !isLight,
};

export default FEATURE_FLAGS;

/**
 * Helper: controlla se una feature è attiva
 * @param {string} flagName - nome del flag (es: 'GAMES', 'XP', etc.)
 * @returns {boolean}
 */
export function isFeatureEnabled(flagName) {
    return FEATURE_FLAGS[flagName] === true;
}
