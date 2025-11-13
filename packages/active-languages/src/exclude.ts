import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const { EXCLUDE_LANG, EXCLUDE_REPO } = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const langsPath = path.join(__dirname, 'store/languages.yml');

const defaultExcludedLang = 'Text,Markdown,HTML,SVG,YAML,TOML,JSON';
const excludedLangs = [defaultExcludedLang, EXCLUDE_LANG].join(',');

const excludedRepos = new Set([...(EXCLUDE_REPO?.split(',') ?? [])]);

type LangDef = { extensions?: string[] };

export const getExcludedExtensions = async (): Promise<Set<string>> => {
    const distinctExludedLang = new Set(
        excludedLangs
            .split(',')
            .map((lang) => lang.trim())
            .filter(Boolean),
    );

    const yml = fs.readFileSync(langsPath, 'utf8');
    const langs = yaml.load(yml) as Record<string, LangDef>;

    const excludedExtensions = new Set<string>();

    for (const [langName, def] of Object.entries(langs)) {
        if (!distinctExludedLang.has(langName)) continue;
        if (!def.extensions) continue;

        for (const ext of def.extensions) {
            // ensure extensions start with .
            const normalized = ext.startsWith('.') ? ext : `.${ext}`;
            excludedExtensions.add(normalized);
        }
    }

    return excludedExtensions;
};

export const getExcludedRepos = (): Set<string> => {
    return excludedRepos;
};
