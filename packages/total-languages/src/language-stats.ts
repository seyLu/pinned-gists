import { githubRequest } from './github-api-client';
import type { GitHubUsername } from './types/env';

interface LanguageStat {
    language: string;
    percentage: number;
}

export const fetchRepoLanguage = async (
    repoOwner: GitHubUsername,
    repoName: string,
) => {
    const { data: languages } = await githubRequest(
        'GET /repos/{owner}/{repo}/languages',
        {
            owner: repoOwner,
            repo: repoName,
        },
    );
    return languages;
};

export const calculateTotalLanguages = async (
    username: GitHubUsername,
    excludedRepos: Set<string>,
) => {
    const { data: repos } = await githubRequest('GET /user/repos', {
        type: 'owner',
        sort: 'updated',
        direction: 'desc',
    });

    const langTotalMap: Record<string, number> = {};

    const repoLangMap = await Promise.all(
        repos
            .filter((repo) => !excludedRepos.has(repo.name) && !repo.fork)
            .map((repo) => fetchRepoLanguage(username, repo.name)),
    );

    repoLangMap.forEach((langMap) => {
        for (const lang in langMap) {
            langTotalMap[lang] = (langTotalMap[lang] ?? 0) + langMap[lang];
        }
    });

    return langTotalMap;
};

const generateBarChart = (percent: number, width: number): string => {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;

    return '█'.repeat(filled) + '░'.repeat(empty);
};

const truncate = (str: string, maxLength: number) =>
    str.length > maxLength ? `${str.slice(0, maxLength - 1)}…` : str;

const formatLanguageStats = (stats: LanguageStat[]): string => {
    return stats
        .map(({ language, percentage }) => {
            const langLabel = truncate(`${language} `, 12).padStart(12);
            const bar = generateBarChart(percentage, 34);
            const percentLabel = `${percentage.toFixed(2)}%`.padStart(6);

            return `${langLabel}${bar} ${percentLabel}`;
        })
        .join('\n');
};

export const createLanguageStats = (
    languageTotals: Record<string, number>,
    excludedLanguages: Set<string>,
) => {
    const sorted = Object.entries(languageTotals)
        .filter(([language]) => !excludedLanguages.has(language))
        .sort((a, b) => b[1] - a[1]);

    const totalBytes = sorted.reduce((sum, [, bytes]) => sum + bytes, 0);

    const languageStats: LanguageStat[] = sorted.map(([language, bytes]) => ({
        language,
        percentage: Math.round((bytes / totalBytes) * 10000) / 100, // 2 decimals
    }));

    return formatLanguageStats(languageStats);
};
