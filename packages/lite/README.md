# OpenCode Lite JS

## Goal

Build a JavaScript-first fork that keeps the useful OpenCode agent kernel while dropping the larger product surface that depends on the existing TypeScript monorepo.

## Architectural Direction

This package is the new home for the JavaScript runtime. It stays small, portable, and dependency-light. The core should remain understandable as a prompt → tools → observation → prompt loop.

Initial package layout:

```text
packages/lite/
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

Runtime responsibilities:

- `agent.js`: main loop, message appends, tool round-trips, session coordination
- `providers.js`: normalized provider boundary and OpenRouter-first adapter strategy
- `tools.js`: tool definitions, validation hooks, permission hooks, execution
- `workspace.js`: portable file workspace API with pluggable backends
- `storage.js`: chat/session persistence with in-memory and browser-friendly adapters
- `index.html`: no-build manual playground for early browser testing

## Workspace Boundary

The agent must depend on a workspace interface rather than directly on Node or browser APIs.

Required surface:

- `read(path)`
- `write(path, content)`
- `edit(path, search, replace)`
- `list(path)`
- `search(query, options)`
- optional `shell(command)` when the workspace exposes that capability

This keeps the same kernel usable in Node, Bun, browsers, WebViews, and future remote workspaces.

## Provider Boundary

Start with one normalized provider contract and keep provider-specific behavior outside the agent loop.

Provider output shape:

- `text`
- `message`
- `toolCalls`
- `usage`
- `finishReason`

Initial provider priority:

1. mock provider for tests
2. OpenRouter adapter for manual free-model testing
3. additional providers only after the core loop is stable

## Delivery Phases

### Phase 1: Kernel Scaffold

- create the JavaScript package
- document the architecture and package boundaries
- add tests for the smallest useful agent loop
- implement in-memory storage and workspace adapters

### Phase 2: Core Coding Tools

- add `read`, `write`, `edit`, `list`, and `search`
- keep tool definitions explicit instead of routing file changes through shell
- add permission checks before mutating or high-risk tools run

### Phase 3: Browser Prototype

- add a no-build `index.html` playground
- wire browser storage and a browser-safe workspace path
- support manual testing against available free models

### Phase 4: Context and Reliability

- add lightweight context selection
- add earlier-conversation summaries
- improve edit reliability and tool result formatting
- add basic retry and failure handling

### Phase 5: Optional Expansion

- Node filesystem backend
- shell capability for trusted local runtimes
- remote workspace adapters
- subagents only after the main loop is stable

## Explicit Non-Goals For The First Iteration

Do not port the current TUI, desktop app, plugins, MCP, background jobs, telemetry, dynamic provider discovery, server mode, or full OpenCode compatibility.

## Branch And Repo Strategy

Use the current repository as the umbrella monorepo, but isolate the JavaScript runtime in `packages/lite`.

- keep the fork default branch aligned with `dev`
- keep the JavaScript rewrite work landing incrementally on short-lived feature branches
- keep each branch focused on one phase or one runtime boundary
- avoid mixing exploratory product ideas with the kernel package work

Suggested branch sequence:

1. `lite-scaffold`
2. `lite-tools`
3. `lite-browser`
4. `lite-openrouter`
5. `lite-context`

## TDD Workflow

Every behavior change in this package should follow the same order:

1. add or update a failing test
2. implement the smallest code change that makes it pass
3. refactor only after the behavior is covered
4. keep the package runnable from its own directory

Initial test targets:

- agent returns plain model output when no tools are requested
- agent executes tool calls and appends tool results before the next provider call
- permissions can block tool execution cleanly
- storage persists and reloads message history
- workspace adapters expose identical behavior across backends

## Manual Testing Plan

Use the package directory for repeatable tests and the browser page for human checks.

- automated: `bun test` from `packages/lite`
- automated: `npm test` or `node --test` from `packages/lite`
- manual: open `packages/lite/index.html`
- provider trials: start with free OpenRouter-compatible models only after the mock-driven loop is stable

## Immediate Next Steps

1. add the package scaffold
2. add failing tests for the core loop and adapters
3. implement the smallest runtime that satisfies those tests
4. add the browser harness
