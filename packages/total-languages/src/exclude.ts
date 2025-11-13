const { EXCLUDE_LANG, EXCLUDE_REPO } = process.env;

const defaultExcludedLang = 'Text,Markdown,HTML,SVG,YAML,TOML,JSON';

const excludedLangs = new Set([
    ...defaultExcludedLang.split(','),
    ...(EXCLUDE_LANG?.split(',') ?? []),
]);

const excludedRepos = new Set([...(EXCLUDE_REPO?.split(',') ?? [])]);

export const getExcludedLangs = (): Set<string> => {
    return excludedLangs;
};

export const getExcludedRepos = (): Set<string> => {
    return excludedRepos;
};
