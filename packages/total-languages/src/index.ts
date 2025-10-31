import { getExcludedLangs, getExcludedRepos } from './exclude';
import { githubRequest } from './github-api-client';
import { calculateTotalLanguages, createLanguageStats } from './language-stats';
import type { GistDescription, GistID, GitHubUsername } from './types/env';

const { GH_TOKEN, GH_USERNAME, TL_GIST_ID, TL_GIST_DESCRIPTION } = process.env;

const validateEnv = (): void => {
    if (!GH_TOKEN) throw new Error('GH_TOKEN is not provided.');
    if (!GH_USERNAME) throw new Error('GH_USERNAME is not provided.');
    if (!TL_GIST_ID) throw new Error('AL_GIST_ID is not provided.');
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
        description: description || '💻 Dev Footprint',
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

        const username = GH_USERNAME as GitHubUsername;
        console.log(`Username: ${username}`);

        const excludedRepos = getExcludedRepos();
        console.log('Calculating stats...');
        const totalLang = await calculateTotalLanguages(username, excludedRepos);
        console.log('Total languages calculated');

        const excludedLangs = getExcludedLangs();
        console.log('Generating stats...');
        const statsLine = createLanguageStats(totalLang, excludedLangs);
        console.log('Generated stats:');
        console.log(statsLine);

        const gistID = TL_GIST_ID as GistID;
        const gistDescription = TL_GIST_DESCRIPTION as GistDescription;

        await updateGist(gistID, statsLine, gistDescription);
    } catch (e) {
        console.error(e);
        process.exitCode = 1;
    }
};

main();
