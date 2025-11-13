<div align="center">
    <img height=200 src="./active-languages.svg" alt="active-languages icon">
    <h1>active-languages</h1>
    <p>Displays the most recently used programming languages based on your GitHub activity.</p>
    <p>This package is part of the `pinned-gists` pnpm monorepo.</p>
    <p>
        <a href="https://github.com/seyLu/pinned-gists/issues/new">Report Bug</a>
        ·
        <a href="https://github.com/seyLu/pinned-gists/issues/new">Request Feature</a>
        ·
        <a href="https://github.com/seyLu/pinned-gists/discussions">Ask Question</a>
    </p>
</div>

<br>

<div id="fine-grained-token"></div>

### GitHub Fine-Grained Token Permissions

#### Public repositories only

Use these permissions if you only want to generate stats from public repositories:

| Category     | Permission | Access       | Purpose                              |
| ------------ | ---------- | ------------ | ------------------------------------ |
| Repositories | Metadata   | Read-only    | Read public repository language data |
| Account      | Gists      | Read & Write | Update the pinned gists              |

#### Including private repositories

Add these if you also want private repository activity included:

| Category     | Permission | Access    | Purpose                                             |
| ------------ | ---------- | --------- | --------------------------------------------------- |
| Repositories | Contents   | Read-only | Access private repo file data for language analysis |
| Account      | Events     | Read-only | Access private contribution activity                |

<br>

### Developing locally

> [!NOTE]
> This package is part of a monorepo. Run all commands from the repository root.

#### 1. Install dependencies

```bash
pnpm i
```

#### 2. Create .env file

```bash
cp .env.example .env
```

Edit `.env` with your values

```env
GH_USERNAME=xxx
GH_TOKEN=xxx

# active-languages
AL_GIST_ID=xxx
AL_GIST_DESCRIPTION=⚡ Active Languages

EXCLUDE_LANG=Text,Markdown,HTML,SVG,YAML,TOML,JSON
EXCLUDE_REPO=xxx
```


#### 3. Run in dev mode

```bash
pnpm al:dev
# will run dev script of 'active-languages' package
```

<br>

### Github Action Setup

#### Required Repository Secret:

| Variable       | Description                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| GH_TOKEN       | GitHub access token with [fine-grained token permissions](#fine-grained-token)                            |

#### Required Repository Variables:

| Variable   | Description                  |
| ---------- | ---------------------------- |
| AL_GIST_ID | Gist ID for active-languages |

*`https://gist.github.com/<username>/<gist-id>`*

#### Optional Repository Variables:

| Variable       | Description                                                                                               |
| ------------   | --------------------------------------------------------------------------------------------------------- |
| EXCLUDE_LANG   | Comma-separated list of languages to exclude. Example: `Jupyter Notebook,CSS,TeX,PHP`                     |
| EXCLUDE_REPO   | Comma-separated list of repositories to exclude. Example: `repo1,repo2`                                   |
| AL_DESCRIPTION | Custom gist description for active-languages                                                              |

*See [languages.yml](https://raw.githubusercontent.com/github/linguist/main/lib/linguist/languages.yml) for supported languages*

<br>

### Create a gist
1. Visit https://gist.github.com
2. Create a new public gist
3. Add a filename (e.g., active-languages.txt)
4. Copy the gist ID from the URL (<gist-id>)

### Pin to profile
1. Follow GitHub’s instructions: [Pinning items to your profile](https://docs.github.com/en/account-and-profile/customizing-your-profile/pinning-items-to-your-profile)

<br>


### Credits
- Inspired by [liby/recent-languages-box](https://github.com/liby/recent-languages-box) with significant improvements and customization.
