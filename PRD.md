# PRD — **GitHub Actions Expressions Evaluator**

## Summary

A beautiful, focused browser tool for **evaluating GitHub Actions expressions**. Developers can quickly test `${{ ... }}` expressions with different contexts (env, vars, secrets, github, inputs, etc.), switch between branches and events, and see instant, accurate results. Clean UI, zero backend, one purpose done exceptionally well.

---

## Goals

1. **Instant, accurate expression evaluation** using GitHub's official `@actions/expressions` library
2. **Easy context switching** — change branches, events, and contexts with sensible defaults
3. **Clean, focused UI** — no clutter, beautiful design, developer-friendly
4. **All GitHub defaults present** — `github.*` context with realistic values, standard functions

---

## Non-Goals (MVP)

* No workflow execution, parsing, or validation
* No actionlint integration
* No YAML editor
* No workspace/file upload for `hashFiles()`
* No variable scoping UI (workflow/job/step)

---

## Core Experience

### Main View (2-panel)

**Left: Expression Input & Results**
* Large, clear input for the expression: `${{ ... }}`
* Auto-evaluation as you type
* Result shown prominently with:
  * **Value** (formatted JSON or primitive)
  * **Type** (string, number, boolean, null, object, array)
  * **Status** (success / error with clear message)
* Copy button for result

**Right: Context Builder**

Tabbed interface for defining contexts, with **smart defaults**:

#### **github** tab (pre-filled with sensible defaults)
* Quick presets dropdown:
  * "Push to main"
  * "Pull request from feature branch"
  * "Release published"
  * "Manual workflow_dispatch"
* Editable fields:
  * `repository` (e.g., "octocat/hello-world")
  * `ref` (e.g., "refs/heads/main")
  * `sha` (e.g., "abc123...")
  * `event_name` (e.g., "push", "pull_request", "workflow_dispatch")
  * `actor` (e.g., "octocat")
  * `ref_name` (e.g., "main")
  * `ref_type` (e.g., "branch", "tag")
  * `base_ref` (for PRs)
  * `head_ref` (for PRs)
* **Raw event payload** (JSON textarea) — auto-populated based on preset, editable

#### **env** tab
* Simple key-value table
* "+ Add variable" button
* Examples: `NODE_VERSION`, `BUILD_CONFIG`, etc.

#### **vars** tab
* Simple key-value table for configuration variables
* "+ Add variable" button
* Examples: `DEPLOY_TARGET`, `API_URL`, etc.

#### **secrets** tab
* Masked key-value pairs (show "••••" by default)
* Optional reveal toggle per secret
* "+ Add secret" button
* Note: "Never leaves your browser"

#### **inputs** tab
* For `workflow_dispatch` or reusable workflow inputs
* Key-value table
* "+ Add input" button

---

## Key Features

### 1. **Branch & Event Quick Switching**
Top bar with:
* Branch selector (text input or dropdown with common names: main, develop, feature/*, etc.)
* Event type selector (push, pull_request, workflow_dispatch, release, etc.)
* "Apply" button → updates `github.*` context instantly

### 2. **Expression Examples Library**
Dropdown or side panel with common expressions users can click to load:
* `github.ref == 'refs/heads/main'`
* `github.event_name == 'pull_request'`
* `contains(github.ref, 'feature/')`
* `startsWith(github.ref, 'refs/tags/')`
* `env.NODE_VERSION || '16'`
* `secrets.NPM_TOKEN != ''`
* `format('v{0}.{1}', vars.MAJOR, vars.MINOR)`
* `toJSON(github)`

### 3. **GitHub Defaults**
Pre-populate `github.*` with realistic values:
```json
{
  "repository": "octocat/hello-world",
  "ref": "refs/heads/main",
  "sha": "ffac537e6cbbf934b08745a378932722df287a53",
  "event_name": "push",
  "actor": "octocat",
  "ref_name": "main",
  "ref_type": "branch",
  "repository_owner": "octocat",
  "run_id": "1234567890",
  "run_number": "42",
  "workflow": "CI",
  ...
}
```

### 4. **Function Support**
All standard GitHub Actions expression functions:
* Logical: `!`, `&&`, `||`
* Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
* String: `contains()`, `startsWith()`, `endsWith()`, `format()`
* Object/Array: `toJSON()`, `fromJSON()`
* Status: `success()`, `failure()`, `cancelled()`, `always()` (show note: "Assumes success by default in evaluator")

Functions requiring filesystem (`hashFiles()`) show inline message: "Not available in expression evaluator."

---

## UI/UX Principles

* **Clean & Minimal** — no unnecessary UI elements
* **Fast** — evaluation updates on every keystroke (<100ms)
* **Keyboard-friendly** — shortcuts for common actions
* **Dark/Light mode** — respect system preference, manual toggle
* **Mobile-responsive** — stack panels vertically on small screens
* **Accessibility** — ARIA labels, keyboard navigation, high contrast

---

## Technical Architecture

* **Frontend-only** — Vite + React (or Vue/Svelte)
* **Expression Engine** — `@actions/expressions` from `actions/languageservices` (MIT)
* **State** — in-memory, auto-save non-secret contexts to localStorage
* **Share Link** — encode expression + contexts (excluding secrets) in URL fragment for easy sharing
* **No Backend** — fully client-side, works offline after initial load

---

## Acceptance Criteria

1. Type `github.ref == 'refs/heads/main'` with default context → evaluates to `true`
2. Change branch to `develop` → re-evaluates to `false`
3. Switch event preset to "Pull request" → `github.event_name` becomes `pull_request`
4. Add `env.VERSION = '1.2.3'` → expression `env.VERSION` returns `'1.2.3'`
5. Use `format('tag-{0}', vars.BUILD)` with `vars.BUILD = 'prod'` → result is `'tag-prod'`
6. Invalid expression syntax shows clear error message
7. Copy result button copies formatted value to clipboard
8. Share link encodes current state, opens in new tab with same expression + contexts (secrets excluded)

---

## Out of Scope (Future)

* Multi-expression evaluation (e.g., test whole workflow)
* Variable precedence/scoping across workflow/job/step
* Workflow YAML parsing or validation
* Integration with GitHub API or repos
* Workspace/file support for `hashFiles()`

---

## References

* `@actions/expressions` — [github.com/actions/languageservices](https://github.com/actions/languageservices)
* Expressions docs — [docs.github.com/en/actions/learn-github-actions/expressions](https://docs.github.com/en/actions/learn-github-actions/expressions)
* Contexts docs — [docs.github.com/en/actions/learn-github-actions/contexts](https://docs.github.com/en/actions/learn-github-actions/contexts)
