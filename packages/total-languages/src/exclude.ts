const { EXCLUDE_LANG, EXCLUDE_REPO } = process.env;

const defaultExcludeLang = 'Text,Markdown,HTML,YAML,JSON';

const excludedLangs = new Set([
    ...defaultExcludeLang.split(','),
    ...(EXCLUDE_LANG?.split(',') ?? []),
]);

const excludedRepos = new Set([...(EXCLUDE_REPO?.split(',') ?? [])]);

export const getExcludedLangs = (): Set<string> => {
    return excludedLangs;
};

export const getExcludedRepos = (): Set<string> => {
    return excludedRepos;
};
