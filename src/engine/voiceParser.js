/**
 * Heuristic NLP parser for converting natural language food diaries into structured queries.
 * Handles Italian phrases like: "ho mangiato duecento grammi di pollo e un cucchiaio d'olio"
 */

const stringToNumber = {
    'un': 1, 'uno': 1, 'una': 1, 'due': 2, 'tre': 3, 'quattro': 4, 'cinque': 5,
    'sei': 6, 'sette': 7, 'otto': 8, 'nove': 9, 'dieci': 10,
    'venti': 20, 'trenta': 30, 'quaranta': 40, 'cinquanta': 50,
    'cento': 100, 'duecento': 200, 'trecento': 300, 'quattrocento': 400, 'cinquecento': 500,
    'mezzo': 0.5, 'mezza': 0.5
};

const volumeToGrams = {
    'cucchiaio': 15,
    'cucchiai': 15,
    'cucchiaino': 5,
    'cucchiaini': 5,
    'tazza': 200,
    'tazze': 200,
    'piatto': 100,
    'fetta': 30, // average default
    'fette': 30,
    'misurino': 30,
    'misurini': 30,
    'scoop': 30
};

// Words to strip out to find the actual food name
const stopWords = ['ho', 'mangiato', 'preso', 'bevuto', 'aggiunto', 'con', 'e', 'di', 'un', 'una', 'il', 'la', 'lo', 'le', 'i', 'gli', 'più', 'del', 'dello', 'della', 'dei', 'degli', 'delle'];

/**
 * Extracts quantity and unit from a segment of text.
 * @param {string} text Segment of speech e.g., "duecento grammi di pollo"
 * @returns {object} { quantityInGrams, remainingText }
 */
const extractQuantity = (text) => {
    let quantity = null;
    let tokens = text.toLowerCase().split(/\s+/);
    let remainingTokens = [...tokens];

    // 1. Try to find explicit numbers (e.g., "200 g", "200g", "200 grammi")
    const numRegex = /^(\d+(?:[.,]\d+)?)(g|grammi|ml)?$/;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // Exact number match
        const match = token.match(numRegex);
        if (match) {
            quantity = parseFloat(match[1].replace(',', '.'));
            remainingTokens.splice(i, 1);

            // Check if next word is "grammi" or "g"
            if (i < tokens.length - 1 && ['g', 'gr', 'grammi', 'ml'].includes(tokens[i + 1])) {
                remainingTokens.splice(i, 1); // remove unit from remaining text
            }
            break;
        }

        // Try text to number (e.g., "duecento")
        if (stringToNumber[token]) {
            let val = stringToNumber[token];

            // Check for complex strings like "duecento cinquanta" -> 250
            if (i < tokens.length - 1 && stringToNumber[tokens[i + 1]]) {
                val += stringToNumber[tokens[i + 1]];
                remainingTokens.splice(i, 2);
                if (i + 1 < tokens.length - 2 && ['g', 'gr', 'grammi', 'ml'].includes(tokens[i + 2])) {
                    remainingTokens.splice(i, 1);
                }
            } else {
                remainingTokens.splice(i, 1);
                if (i < tokens.length - 1 && ['g', 'gr', 'grammi', 'ml'].includes(tokens[i + 1])) {
                    remainingTokens.splice(i, 1);
                }
            }
            quantity = val;
            break;
        }
    }

    // 2. If no strict number found, look for volume keywords (e.g., "un cucchiaio")
    if (quantity === null) {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (volumeToGrams[token]) {
                // Determine multiplier (e.g. "due cucchiai" vs "un cucchiaio")
                let multiplier = 1;
                if (i > 0 && stringToNumber[tokens[i - 1]]) {
                    multiplier = stringToNumber[tokens[i - 1]];
                    // Remaining tokens: remove the number and the unit
                    const itemToRemoveIdx = remainingTokens.indexOf(tokens[i]);
                    if (itemToRemoveIdx > -1) remainingTokens.splice(itemToRemoveIdx, 1); // Remove 'cucchiai'
                    const numToRemoveIdx = remainingTokens.indexOf(tokens[i - 1]);
                    if (numToRemoveIdx > -1) remainingTokens.splice(numToRemoveIdx, 1); // Remove 'due'
                } else if (i > 0 && !isNaN(parseFloat(tokens[i - 1]))) {
                    multiplier = parseFloat(tokens[i - 1]);
                    const itemToRemoveIdx = remainingTokens.indexOf(tokens[i]);
                    if (itemToRemoveIdx > -1) remainingTokens.splice(itemToRemoveIdx, 1);
                    const numToRemoveIdx = remainingTokens.indexOf(tokens[i - 1]);
                    if (numToRemoveIdx > -1) remainingTokens.splice(numToRemoveIdx, 1);
                } else {
                    const itemToRemoveIdx = remainingTokens.indexOf(tokens[i]);
                    if (itemToRemoveIdx > -1) remainingTokens.splice(itemToRemoveIdx, 1);
                }

                quantity = volumeToGrams[token] * multiplier;
                break;
            }
        }
    }

    return {
        quantityInGrams: quantity || 100, // Default to 100 if nothing found
        remainingText: remainingTokens.join(' ')
    };
};

/**
 * Cleans the query string to just find the food name.
 */
const cleanFoodQuery = (text) => {
    const tokens = text.toLowerCase().split(/\s+/);
    const cleaned = tokens.filter(t => !stopWords.includes(t) && t.length > 2);
    // Remove punctuation
    return cleaned.join(' ').replace(/[.,:;!?]/g, '').trim();
};

/**
 * Parses a full phrase into an array of food queries with grams.
 * @param {string} text e.g., "Ho mangiato 200g di petto di pollo e un cucchiaio d'olio evo"
 * @returns {Array} [{ foodQuery: "petto pollo", grams: 200 }, { foodQuery: "olio evo", grams: 15 }]
 */
export const parseVoiceInputToFoodQueries = (text) => {
    if (!text) return [];

    // Split phrase by common connectors (" e ", " con ", ", ", " più ")
    // We add spaces padding to ensure we don't split inside words
    const segments = text
        .toLowerCase()
        .replace(/ e /g, '|')
        .replace(/ con /g, '|')
        .replace(/, /g, '|')
        .replace(/ più /g, '|')
        .replace(/ ed /g, '|')
        .split('|')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    const results = [];

    for (const segment of segments) {
        const { quantityInGrams, remainingText } = extractQuantity(segment);
        const foodQuery = cleanFoodQuery(remainingText);

        if (foodQuery) {
            results.push({
                query: foodQuery,
                originalSegment: segment,
                grams: quantityInGrams
            });
        }
    }

    return results;
};
