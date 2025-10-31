import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const { EXCLUDE_LANG } = process.env;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const langsPath = path.join(__dirname, 'store/languages.yml');

const defaultExcludeLang = 'Text,Markdown,HTML,YAML,JSON';
const excludeLangs = [defaultExcludeLang, EXCLUDE_LANG].join(',');

type LangDef = { extensions?: string[] };

export const getExcludedExtensions = async (): Promise<Set<string>> => {
    const distinctExludeLang = new Set(
        excludeLangs
            .split(',')
            .map((lang) => lang.trim())
            .filter(Boolean),
    );

    const yml = fs.readFileSync(langsPath, 'utf8');
    const langs = yaml.load(yml) as Record<string, LangDef>;

    const excludedExtensions = new Set<string>();

    for (const [langName, def] of Object.entries(langs)) {
        if (!distinctExludeLang.has(langName)) continue;
        if (!def.extensions) continue;

        for (const ext of def.extensions) {
            // ensure extensions start with .
            const normalized = ext.startsWith('.') ? ext : `.${ext}`;
            excludedExtensions.add(normalized);
        }
    }

    return excludedExtensions;
};
