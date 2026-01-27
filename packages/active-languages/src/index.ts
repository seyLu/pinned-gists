import { getExcludedExtensions, getExcludedRepos } from './exclude';
import { githubRequest } from './github-api-client';
import { createLanguageStats } from './language-stats';
import { type FileData, runLinguist } from './linguist-analyzer';
import type { GetCommitContentsResponse } from './types/commit';
import type { GistDescription, GistID, GitHubUsername } from './types/env';

const { GH_TOKEN, GH_USERNAME, AL_GIST_ID, AL_GIST_DESCRIPTION, DAYS } = process.env;

const validateEnv = (): void => {
    if (!GH_TOKEN) throw new Error('GH_TOKEN is not provided.');
    if (!GH_USERNAME) throw new Error('GH_USERNAME is not provided.');
    if (!AL_GIST_ID) throw new Error('AL_GIST_ID is not provided.');
};

const fetchCommits = async (
    username: GitHubUsername,
    fromDate: Date,
    excludedRepos: Set<string>,
): Promise<GetCommitContentsResponse[]> => {
    console.log(`Fetching repositories for ${username}...`);

    const repos = await githubRequest('GET /user/repos', {
        affiliation: 'owner',
        sort: 'updated',
        direction: 'desc',
        per_page: 100,
    });

    const commits: GetCommitContentsResponse[] = [];

    const activeRepos = repos.data.filter((repo) => {
        if (excludedRepos.has(repo.name)) return false;

        const pushedDate = new Date(repo.pushed_at ?? 0);
        return pushedDate > fromDate;
    });

    console.log(
        `Found ${activeRepos.length} repositories active since ${fromDate.toISOString()}`,
    );

    for (const repo of activeRepos) {
        console.log(`Checking commits in ${repo.name}...`);

        try {
            const repoCommits = await githubRequest(
                'GET /repos/{owner}/{repo}/commits',
                {
                    owner: repo.owner.login,
                    repo: repo.name,
                    since: fromDate.toISOString(),
                    author: username,
                    per_page: 100,
                },
            );

            if (repoCommits.data.length > 0) {
                console.log(
                    `   > Found ${repoCommits.data.length} commits in ${repo.name}`,
                );

                const commitDetailsPromises = repoCommits.data.map((commit) =>
                    githubRequest('GET /repos/{owner}/{repo}/commits/{ref}', {
                        owner: repo.owner.login,
                        repo: repo.name,
                        ref: commit.sha,
                    }).then((res) => res.data),
                );

                const commitDetails = await Promise.all(commitDetailsPromises);
                commits.push(...commitDetails);
            }
        } catch (error: any) {
            console.error(
                `   > Failed to fetch commits for ${repo.name}: ${error.message}`,
            );
        }
    }

    return commits;
};

const processCommits = (commits: GetCommitContentsResponse[]): FileData[] => {
    const result = commits
        .filter((commit) => commit.parents.length <= 1)
        .flatMap((commit) =>
            commit.files?.map(
                ({ filename, additions, deletions, changes, status, patch }) => ({
                    path: filename,
                    additions,
                    deletions,
                    changes,
                    status,
                    patch,
                }),
            ),
        )
        .filter((fileData) => fileData !== undefined);

    return result;
};

const updateGist = async (
    gistID: GistID,
    content: string,
    description?: GistDescription,
) => {
    const gist = await githubRequest('GET /gists/{gist_id}', {
        gist_id: gistID,
    });
    const filename = Object.keys(gist.data.files ?? {})[0];
    await githubRequest('PATCH /gists/{gist_id}', {
        gist_id: gistID,
        description: description || '⚡ Active Languages',
        files: {
            [filename]: {
                content,
            },
        },
    });
    console.log('Update succeeded.');
};

const main = async () => {
    try {
        validateEnv();

        const excludedExts = await getExcludedExtensions();

        const username = GH_USERNAME as GitHubUsername;
        console.log(`Username: ${username}`);

        const days = Math.max(1, Math.min(30, Number(DAYS || 14)));
        const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        console.log(`Fetching data for the last ${days} days`);

        const excludedRepos = getExcludedRepos();
        const commits = await fetchCommits(username, fromDate, excludedRepos);
        console.log(`${commits.length} commits fetched.`);
        console.log('\n');

        const files = processCommits(commits);
        const langs = await runLinguist(files, excludedExts);
        console.log('\nLanguage statistics:');
        for (const lang of langs) {
            console.log(
                `${lang.name}: ${lang.count} files, ${lang.additions + lang.deletions} changes`,
            );
        }

        const content = createLanguageStats(langs);
        console.log('\nGenerated content:');
        console.log(content);
        console.log('\n');

        const gistID = AL_GIST_ID as GistID;
        const gistDescription = AL_GIST_DESCRIPTION as GistDescription;
        await updateGist(gistID, content, gistDescription);
    } catch (e) {
        console.error(e);
        process.exitCode = 1;
    }
};

main();
