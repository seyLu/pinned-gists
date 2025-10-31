<div align="center">
    <img height=150 src="./pinned-gists.svg" alt="pinned-gists icon">
    <h1>pinned-gists</h1>
    <p>A collection of GitHub Stats pinned gists.</p>
    <p>
        <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></img></a>
        <a href="https://vitest.dev/"><img src="https://img.shields.io/badge/Vitest-%236E9F18?style=for-the-badge&logo=Vitest&logoColor=%23fcd703" alt="Vitest"></img></a>
        <a href="https://https://pnpm.io/"><img src="https://img.shields.io/badge/pnpm-yellow?style=for-the-badge&logo=pnpm&logoColor=white" alt="PNPM"></img></a>
        <a href="https://biomejs.dev/"><img src="https://img.shields.io/badge/biome-60a5fa?style=for-the-badge&logo=biome&logoColor=white" alt="Biome"></img></a>
    </p>
    <p>
        <a href="https://github.com/seyLu/pinned-gists/issues/new">Report Bug</a>
        ·
        <a href="https://github.com/seyLu/pinned-gists/issues/new">Request Feature</a>
        ·
        <a href="https://github.com/seyLu/pinned-gists/discussions">Ask Question</a>
    </p>
</div>

<br>

### Pinned Gists:

#### [active-languages](https://github.com/seyLu/pinned-gists/blob/main/packages/active-languages/README.md)
<img height=250 src="./packages/active-languages/active-languages.svg" alt="active-languages icon">

#### [total-languages](https://github.com/seyLu/pinned-gists/blob/main/packages/total-languages/README.md)
<img height=250 src="./packages/total-languages/total-languages.svg" alt="total-languages icon">

<br>

### Developing locally

#### 1. Install dependencies

```bash
pnpm i
```

#### 2. Supply .env values

```bash
cp .env.example .env
```

```env
GH_USERNAME=xxx
GH_TOKEN=xxx

AL_GIST_ID=xxx
AL_GIST_DESCRIPTION=⚡ Active Languages

TL_GIST_ID=xxx
TL_GIST_DESCRIPTION=💻 Dev Footprint

EXCLUDE_LANG=Text,Markdown,HTML,YAML,JSON
EXCLUDE_REPO=xxx
```


#### 2. Run dev script of a specific package

```bash
pnpm al:dev
# will run dev script of 'active-languages' package
```
