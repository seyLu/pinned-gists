import { githubRequest } from './github-api-client';
import { createLanguageStats } from './language-stats';
import { type FileData, runLinguist } from './linguist-analyzer';
import type { GetCommitContentsResponse } from './types/commit';
import type { PushEvent } from './types/event';

const { GH_TOKEN, GH_USERNAME, AL_GIST_ID, DAYS } = process.env;

import { getExcludedExtensions } from './excluded-extensions';

const validateEnv = (): void => {
    if (!GH_TOKEN) throw new Error('GH_TOKEN is not provided.');
    if (!AL_GIST_ID) throw new Error('AL_GIST_ID is not provided.');
    if (!GH_USERNAME) throw new Error('GH_USERNAME is not provided.');
};

const fetchCommits = async (
    username: string | null,
    fromDate: Date,
): Promise<GetCommitContentsResponse[]> => {
    if (username === null) {
        throw new Error('GH_USERNAME is not provided.');
    }

    const maxEvents = 300;
    const perPage = 100;
    const pages = Math.ceil(maxEvents / perPage);
    const commits: GetCommitContentsResponse[] = [];

    for (let page = 1; page <= pages; page++) {
        const events = await githubRequest('GET /users/{username}/events', {
            username,
            per_page: perPage,
            page,
        });
        const pushEvents = events.data.filter(
            (event): event is PushEvent => event.type === 'PushEvent',
        );

        const recentPushEvents = pushEvents.filter(
            ({ created_at }) => new Date(created_at) > fromDate,
        );
        console.log(`${recentPushEvents.length} events fetched.`);

        const newCommits = await Promise.allSettled(
            recentPushEvents.flatMap(({ repo, payload }) => {
                const [owner, repoName] = repo.name.split('/');

                if (payload.commits && Array.isArray(payload.commits)) {
                    return payload.commits
                        .filter((commit) => commit.distinct)
                        .map((commit) =>
                            githubRequest('GET /repos/{owner}/{repo}/commits/{ref}', {
                                owner,
                                repo: repoName,
                                ref: commit.sha,
                            }),
                        );
                }

                if (payload.head) {
                    return [
                        githubRequest('GET /repos/{owner}/{repo}/commits/{ref}', {
                            owner,
                            repo: repoName,
                            ref: payload.head,
                        }),
                    ];
                }

                return [];
            }),
        );

        commits.push(
            ...newCommits
                .filter((result) => result.status === 'fulfilled')
                .map((result) => {
                    return result.value.data;
                }),
        );

        if (recentPushEvents.length < pushEvents.length) {
            break;
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

const updateGist = async (gistId: string, content: string) => {
    const gist = await githubRequest('GET /gists/{gist_id}', {
        gist_id: gistId,
    });
    const filename = Object.keys(gist.data.files ?? {})[0];
    await githubRequest('PATCH /gists/{gist_id}', {
        gist_id: gistId,
        files: {
            [filename]: {
                filename: `seyLu's Recent Coding Languages`,
                content,
            },
        },
    });
    console.log('Update succeeded.');
};

const main = async () => {
    try {
        validateEnv();

        const excludeExt = await getExcludedExtensions();

        const username = GH_USERNAME ?? null;
        const days = Math.max(1, Math.min(30, Number(DAYS || 14)));
        const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        console.log(`Username: ${username}`);
        console.log(`Fetching data for the last ${days} days`);

        const commits = await fetchCommits(username, fromDate);
        console.log(`${commits.length} commits fetched.`);
        console.log('\n');

        const files = processCommits(commits);
        const langs = await runLinguist(files, excludeExt);
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

        if (AL_GIST_ID) {
            await updateGist(AL_GIST_ID, content);
        } else {
            throw new Error('AL_GIST_ID is not provided.');
        }
    } catch (e) {
        console.error(e);
        process.exitCode = 1;
    }
};

main();
