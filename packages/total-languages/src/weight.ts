/**
 * Define weight multipliers for specific languages.
 * Languages get lower weights because of boilerplate code that
 * does not accurately reflect the actual lines of logic written.
 *
 * - A weight of 1.0 is the default (counts for 100% of its bytes).
 * - A weight of 0.5 means the language will only count for 50%.
 */
export const getLanguageWeights = (): Record<string, number> => {
    return {
        TypeScript: 0.3,
        HTML: 0.3,
        Vue: 0.5,
        SCSS: 0.5,
        // Any language not listed here defaults to 1.0 (100%)
    };
};
