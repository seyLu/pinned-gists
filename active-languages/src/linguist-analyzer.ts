import { exec } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface FileData {
  additions?: number;
  changes?: number;
  deletions?: number;
  patch?: string;
  path: string;
  status: string;
}

interface LanguageDetails {
  size: number;
  percentage: string;
  files: string[];
}

interface LinguistResult {
  [language: string]: LanguageDetails;
}

export interface ProcessedLanguageStats {
  name: string;
  percent: number;
  additions: number;
  deletions: number;
  count: number;
}

const runCommand = (command: string): Promise<string> =>
  new Promise((resolve, reject) => {
    console.debug(`run > ${command}`);
    const child = exec(command);
    let stdout = '';
    let stderr = '';

    if (child.stdout) {
      child.stdout.on('data', (data) => {
        stdout += data;
      });
    }

    if (child.stderr) {
      child.stderr.on('data', (data) => {
        stderr += data;
      });
    }

    child.on('close', (code) => {
      console.debug(`exited with code ${code}`);
      return code === 0 ? resolve(stdout) : reject(stderr);
    });
  });

const runCommandWithRetry = async (command: string, retries = 3): Promise<string> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await runCommand(command);
    } catch (error) {
      if (i === retries - 1) throw error;
      console.warn(`Command failed, retrying (${i + 1}/${retries}): ${command}`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待1秒后重试
    }
  }
  throw new Error(`Command failed after ${retries} retries: ${command}`);
};

const createDummyText = (count: number): string => {
  return '\n'.repeat(count);
};

const createFileContent = (fileData: FileData): string => {
  if (fileData.patch) {
    return fileData.patch
      .split('\n')
      .filter((line) => /^[-+]/.test(line))
      .map((line) => line.substring(1))
      .join('\n');
  }
  return fileData.changes ? createDummyText(fileData.changes) : '';
};

export const runLinguist = async (
  files: FileData[],
  excludeExt: Set<string>,
): Promise<ProcessedLanguageStats[]> => {
  try {
    // Create temp linguist dir
    const tmp = './.linguist_tmp';

    await runCommand(`rm -rf ${tmp}`);
    await runCommand(`mkdir ${tmp}`);
    await runCommand(`git -C ${tmp} init`);

    // Prepare files
    const processFileData = files
      .filter((file) => !excludeExt.has(path.extname(file.path)))
      .map((file, index) => ({
        ...file,
        path: `${index}${path.extname(file.path)}`, // rename to avoid collisions
      }));

    const pathFileMap = processFileData.reduce<Record<string, FileData>>(
      (acc, file) => {
        acc[file.path] = file;
        return acc;
      },
      {},
    );

    // Write synthetic files inside tmp repo
    await Promise.all([
      ...processFileData.map((file) =>
        writeFile(`${tmp}/${file.path}`, createFileContent(file)),
      ),
      runCommand(`echo "*.* linguist-detectable" > ${tmp}/.gitattributes`),
      runCommand(`git -C ${tmp} config user.name "dummy"`),
      runCommand(`git -C ${tmp} config user.email "dummy@github.com"`),
    ]);

    // Git add + commit in tmp repo
    await runCommand(`git -C ${tmp} add .`);
    await runCommand(`git -C ${tmp} commit -m "dummy"`);

    // Run Linguist on isolated repo
    const stdout = await runCommand(`github-linguist --breakdown --json --path ${tmp}`);
    const linguistResult = JSON.parse(stdout) as LinguistResult;

    // Process the language stats
    const languageStats = Object.entries(linguistResult).map(([name, stats]) => {
      const additions = stats.files.reduce(
        (sum, filePath) => sum + (pathFileMap[filePath]?.additions ?? 0),
        0,
      );
      const deletions = stats.files.reduce(
        (sum, filePath) => sum + (pathFileMap[filePath]?.deletions ?? 0),
        0,
      );
      return {
        name,
        additions,
        deletions,
        count: stats.files.length,
        // Calculate initial percent based on the returned data
        percent: additions + deletions, // placeholder for percent, will be recalculated
      };
    });

    // Calculate total additions and deletions across all languages
    const totalChanges = languageStats.reduce(
      (sum, lang) => sum + lang.additions + lang.deletions,
      0,
    );

    // Update the percent based on the total changes
    for (const lang of languageStats) {
      lang.percent = ((lang.additions + lang.deletions) / totalChanges) * 100;
    }

    // Sort the language stats by the total changes
    return languageStats.sort((a, b) => b.percent - a.percent);
  } finally {
    // Clean up
    process.chdir('..');
  }
};
