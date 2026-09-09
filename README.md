# OpenCode Lite JS

Portable JavaScript coding agent runtime.

## Goal

This repository contains only the Lite JavaScript version. It keeps the useful agent kernel and leaves the rest of the OpenCode product surface to the upstream repository.

## Repository Layout

```text
.
  README.md
  package.json
  index.html
  agent.js
  providers.js
  tools.js
  workspace.js
  storage.js
  test/
```

## Runtime Shape

- `agent.js`: prompt → tool → observation loop
- `providers.js`: normalized provider boundary and OpenRouter adapter
- `tools.js`: tool definitions, permissions, and execution
- `workspace.js`: portable workspace abstraction
- `storage.js`: session/message persistence
- `index.html`: no-build browser playground

## Workspace Interface

- `read(path)`
- `write(path, content)`
- `edit(path, search, replace)`
- `list(path)`
- `search(query)`
- optional `shell(command)` for trusted local runtimes later

## Development

Run tests from the repository root:

```bash
npm test
```

Manual browser check:

- open `/home/runner/work/opencode-lite-js/opencode-lite-js/index.html`

## GitHub Pages And CI/CD

- `.github/workflows/lite-ci.yml` runs the root test suite
- `.github/workflows/lite-pages.yml` deploys the browser playground to GitHub Pages from `main`

Expected Pages URL:

- `https://jkershaw.github.io/opencode-lite-js/`

Setup:

1. Set GitHub Pages to deploy from **GitHub Actions**
2. Push `main` to trigger deploys
3. Use **Run workflow** on `lite-pages` for manual deploys

## Security Note

The browser playground sends the OpenRouter API key from client-side JavaScript.

- use a restricted personal test key only
- enter the key manually for each browser session because it is not stored
- do not treat the current browser deployment as production-secret-safe

## Branch Strategy

- `main`: standalone Lite JavaScript product branch
- `dev`: optional upstream reference branch only if you still want to track OpenCode separately

After CI passes, create `main` from this cleaned Lite branch and use it as the default branch.
