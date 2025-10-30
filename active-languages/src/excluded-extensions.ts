import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const { EXCLUDE } = process.env;

type LangDef = { extensions?: string[] };

const excludeLang = ['Text,Markdown,HTML,YAML,JSON', EXCLUDE].join(',');

export async function getExcludedExtensions(): Promise<Set<string>> {
  const distinctExludeLang = new Set(
    excludeLang
      .split(',')
      .map((lang) => lang.trim())
      .filter(Boolean),
  );

  const yml = fs.readFileSync(
    path.join(__dirname, '/store/languages.yml'),
    'utf8',
  );
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
}
