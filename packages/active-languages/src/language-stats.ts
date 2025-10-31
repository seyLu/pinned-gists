import type { ProcessedLanguageStats } from './linguist-analyzer';

const UNITS = [
    { symbol: 'E', value: 1e18 },
    { symbol: 'P', value: 1e15 },
    { symbol: 'T', value: 1e12 },
    { symbol: 'G', value: 1e9 },
    { symbol: 'M', value: 1e6 },
    { symbol: 'k', value: 1e3 },
] as const;

const truncateString = (str: string, maxLength: number): string => {
    return str.length > maxLength ? `${str.substring(0, maxLength - 1)}…` : str;
};

const formatNumber = (num: number): string => {
    for (const { symbol, value } of UNITS) {
        const quotient = num / value;
        if (quotient >= 1) {
            return `${quotient.toFixed(1)}${symbol}`;
        }
    }
    return `${num}`;
};

export function generateBarChart(percent: number, width = 36): string {
    let filled = Math.round((percent / 100) * width);

    if (percent > 0 && filled === 0) filled = 1;

    filled = Math.min(filled, width);
    const empty = width - filled;

    return '█'.repeat(filled) + '░'.repeat(empty);
}

export const createLanguageStats = (languages: ProcessedLanguageStats[]): string => {
    return languages
        .map(({ name, percent, additions, deletions }) => {
            const truncatedName = truncateString(name, 10).padEnd(10);

            const formattedAdditions = `+${formatNumber(additions)}`.padStart(7);
            const formattedDeletions = `-${formatNumber(deletions)}`.padStart(7);
            const formatChanges = `${formattedAdditions} /${formattedDeletions}`;

            const bar = generateBarChart(percent, 18);
            const percentageString = `${percent.toFixed(2).padStart(5)}%`;

            return `${truncatedName} ${formatChanges} ${bar} ${percentageString}`;
        })
        .join('\n');
};
