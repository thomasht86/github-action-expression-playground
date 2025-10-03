Below is a crisp PRD for a **front‑end–only MVP** that gives people a **great UX to experiment with GitHub Actions expressions and variables**—no workflow execution, no back end.

---

# PRD — **GitHub Actions Expressions & Variables Playground (Front‑End Only MVP)**

## 1) Summary

A browser‑based playground that lets users **paste or import a workflow YAML**, **define variables/contexts interactively**, and **see instant, GitHub‑accurate parsing and expression evaluation**—including validation/error messages and a clear view of precedence and final resolved values.

> **Fidelity:** The MVP must rely on **GitHub’s official language packages** for parsing and expression evaluation and on **actionlint (WASM)** for static checks to keep behavior aligned with GitHub. Specifically:
>
> * `@actions/expressions` and `@actions/workflow-parser` from the **`actions/languageservices`** repo; the repo ships a **browser playground** we can adapt and is MIT‑licensed. ([GitHub][1])
> * **actionlint** has an official web playground and a WASM build we can embed for instant linting. ([rhysd.github.io][2])
> * The **workflow schema** comes from `workflow-v1.0.json` in `actions/languageservices`. ([GitHub][3])
> * **Semantics** (contexts, expressions, variables) must follow the GitHub Docs. ([GitHub Docs][4])

---

## 2) Goals & Non‑Goals

### Goals

1. **Accurate parsing & evaluation** of `${{ ... }}` against user‑supplied contexts (`env`, `vars`, `secrets`, `inputs`, `github`, `matrix`, `needs`, etc.) with **live feedback**.
2. **Great UX** for **adding and scoping variables** (workflow, job, step), viewing **effective values** and **override/precedence**.
3. **Inline validation**: YAML schema validation + expression errors + actionlint diagnostics as you type.
4. **Explainability**: show evaluation result **type**, **value**, and **where each piece came from** (scope chain).
5. **Zero back end**: everything runs locally in the browser (Web Workers + WASM).

### Non‑Goals (MVP)

* **No workflow execution** (no `act`, no runners).
* **No networked secrets** (user secrets never leave the page).
* **No GitHub API integration** (no repo cloning, no auth); users paste YAML or upload files.

---

## 3) Users & Core Use Cases

* **Action authors** verifying `${{ }}` logic, inputs, and vars.
* **CI owners** checking precedence/allowed contexts and avoiding runtime surprises.
* **Learners** experimenting safely with expressions.

**Representative tasks**

* “Given this YAML, what does `${{ github.ref == 'refs/heads/main' }}` evaluate to?”
* “If I set `env.VERSION` at workflow/job/step, which wins?”
* “Where can I use `vars`/`env`/`secrets`? Why is this expression invalid here?”

---

## 4) Product Experience

### 4.1 Primary Screen (3‑pane layout)

**A) Editor (left)**

* Monaco editor with YAML syntax, **schema‑aware completions/hover** via `@actions/languageservice`. ([npm][5])
* **actionlint** diagnostics appear inline (squiggles + problems list). ([rhysd.github.io][2])

**B) Context & Variables Builder (right‑top)**
Tabbed builder with **friendly forms** and **“Add variable”** affordances:

* **env**: workflow / job / step scopes (switch scope with a dropdown).
* **vars**: read‑only default section + user‑add section (org/repo/env analog) to simulate `vars.*`.
* **secrets**: masked inputs; show “••••” with one‑time “reveal” toggle (session only).
* **inputs**: key/value for `workflow_dispatch` and reusable workflows.
* **github**: quick fill (owner/repo/sha/ref/event) + raw **event payload JSON** textarea.
* **matrix**: define simple matrices to test indexing: `matrix.node`, `matrix.os`.
* **needs**: insert sample outputs for upstream jobs.

**C) Results & Insights (right‑bottom)**

* **Ad‑hoc evaluator**: input box for any expression; shows **value (JSON), type**, and **explain** panel (tokenized summary, context hits).
* **“Effective env” inspector**: pick **workflow / job / step** → see final env with **override badges** (e.g., “overrides workflow”).
* **Context availability hints**: when cursor is on a key (e.g., `jobs.<id>.if`), show a sidenote listing **allowed contexts for that key**; disallow or warn for others. (Use published rules—e.g., `jobs.<job_id>.concurrency` allows `github`, `inputs`, `vars`, `needs`, `strategy`, `matrix`; **env is not allowed in some keys like job‑level `if`**). ([GitHub Docs][6])

### 4.2 Micro‑interactions

* **+ Add variable** adds a row instantly, focusing name, validating naming rules live.
* Hover on `${{ … }}` in the editor → **popover** shows the evaluated value for that exact scope, or why it can’t be evaluated statically.
* **Copy result** buttons for values/JSON contexts.

### 4.3 Import/Export

* **Paste YAML** (default), or **upload a single YAML**.
* **Export sharable state**: JSON (YAML + contexts) downloaded locally; “Copy share link” encodes state in the URL fragment (no server).

---

## 5) Functional Requirements

### 5.1 Parsing, Validation, and Editor

1. **YAML schema validation** using `@actions/workflow-parser` + bundled `workflow-v1.0.json`. ([GitHub][3])
2. **Completions/hover** via `@actions/languageservice` (value & context providers). ([npm][5])
3. **Static checks** via **actionlint (WASM)** with diagnostics aggregated with schema/parse errors. ([rhysd.github.io][2])

### 5.2 Expression Evaluation

1. **Evaluation engine**: `@actions/expressions` (TS) as single source of truth. ([GitHub][1])
2. **Contexts provided by UI**: `github`, `env`, `vars`, `secrets`, `inputs`, `matrix`, `needs`, `runner` (subset), `strategy`.
3. **Explain mode**: after evaluation, display:

   * **Final value**, **type**, and **stringification** (if interpolated).
   * **Context hits** (which context keys were read).
   * **Precedence** notes when env values are overridden.
4. **Context availability rules**: maintain a **per‑key allowlist** (e.g., job `concurrency.group`, job `if`, reusable workflow `with`), surfaced as hints and validation. (Use docs pages that explicitly enumerate allowed contexts). ([GitHub Docs][6])
5. **Functions that need runtime/FS**:

   * `hashFiles()` → Only evaluate if user has provided a **workspace** (zip or directory picker). Else show a **callout**: “Requires workspace files”. (Runner ADR documents FS requirement.) ([GitHub][7])
   * Status functions (`success()`, etc.) → allow evaluation but **surface assumption** (“no prior steps run in MVP”). Users can toggle simulated statuses per step.
6. **String interpolation preview**: For fields like `env: NAME: foo-${{ vars.BAR }}`, show the **resolved string** given current contexts.

### 5.3 Variables & Precedence

1. **Scopes**: workflow → job → step; **most specific wins while executing**. Show this rule **visually** and apply it when computing “Effective env”. ([GitHub Docs][8])
2. **Default variables**: clarify that some **default environment variables** are not available via `env` context; show equivalents via `github.*` where possible. ([GitHub Docs][8])
3. **`vars`**: treat as **read‑only config variables** (org/repo/env simulated locally); edit UI simply sets `vars.*` for evaluation. ([GitHub Docs][8])

### 5.4 Workspace Support (Optional in MVP, but spec’d)

* **Upload zip** (or choose folder via File System Access API) to let the evaluator serve `hashFiles()` and **glob** behavior; compute SHA‑256 with Web Crypto; use `picomatch`/`minimatch` for globbing to mirror runner semantics.

---

## 6) Non‑Functional Requirements

* **Performance:** first evaluation < **200 ms** for typical workflows (<300 lines); actionlint initialization < **1.5 s** on cold load (WASM in a Web Worker).
* **Availability/Offline:** fully client‑side; no network dependency after static assets load.
* **Privacy:** no data leaves the browser; **secrets never stored** beyond session (no localStorage), appear masked by default.
* **Accessibility:** keyboard‑first, ARIA on all inputs, focus outlines, color‑contrast ≥ 4.5:1.
* **Internationalization (Nice‑to‑have):** strings gated behind a simple i18n layer.

---

## 7) Architecture & Tech Choices

* **Language:** TypeScript.
* **Build:** Vite.
* **Editor:** Monaco.
* **Workers:** Web Workers for `@actions/expressions`, `@actions/workflow-parser`, and **actionlint (WASM)** to keep the UI responsive.
* **Packages:**

  * `@actions/expressions`, `@actions/workflow-parser`, `@actions/languageservice` (from `actions/languageservices`). ([GitHub][1])
  * `actionlint` WASM. ([GitHub][9])
* **State:**

  * YAML + contexts kept in memory; YAML and **non‑secret** contexts autosaved to `localStorage`.
  * “Share link” encodes state in URL fragment (base64) for copy‑paste sharing; secrets excluded.

---

## 8) UX Details (Great “Add Variables” Experience)

* **Scope switcher** (Workflow | Job | Step) at top of the Variables panel.
* **Variable table** with inline add:

  * Columns: **Name** (validated live), **Value** (free‑text or JSON), **Type** (env/vars/secret), **Scope** (auto‑set from current tab), **Actions** (duplicate, delete).
  * **Quick‑add buttons** for popular keys (e.g., `NODE_AUTH_TOKEN`, `NPM_TOKEN`, `VERSION`).
  * **Override indicators**: If adding a name that already exists in a broader scope, show a small badge “Overrides workflow/job”.
* **“Effective env” viewer** updates on every keystroke; shows **diff** against broader scope values.
* **Inline docs** tooltips next to context selectors (e.g., “`vars` are configuration variables defined at org/repo/env, read‑only at runtime”). ([GitHub Docs][8])
* **Context‑aware hints** when cursor is on keys like `jobs.<id>.if` with **allowed contexts** list (e.g., `github`, `needs`, `vars`, `inputs` for certain keys). ([GitHub Docs][10])

---

## 9) Acceptance Criteria

1. **Paste YAML** with `${{ vars.BRANCH }}` in a job `if`: typing `vars.BRANCH=main` updates the evaluation **immediately** and shows **true/false** in the inspector.
2. **Add `env.VERSION` at workflow + job + step** → “Effective env” shows the **step‑level value** with badges indicating it overrides job/workflow. (Matches precedence rules.) ([GitHub Docs][8])
3. Hover over an expression inside the YAML → popover shows **evaluated value** or a **clear reason** it can’t be evaluated (e.g., disallowed context at that key).
4. actionlint identifies **at least one** syntax issue (e.g., bad `runs-on`) with an inline diagnostic linking to its rule docs. ([rhysd.github.io][2])
5. Typing an expression that uses a **disallowed context** at `jobs.<id>.concurrency.group` shows a contextual warning and suggests allowed contexts (`github`, `inputs`, `vars`, `needs`, `strategy`, `matrix`). ([GitHub Docs][6])
6. Using `hashFiles()` without a workspace shows a callout explaining the limitation and a prompt to upload files (per runner ADR). ([GitHub][7])

---

## 10) Metrics (Client‑only)

* **TTFB‑Eval:** time from keystroke to evaluation result render (<200 ms p50).
* **Lint coverage:** % of files with ≥1 actionlint diagnostic surfaced.
* **Interaction success:** % of sessions where users add at least one variable and see the “Effective env” view.
* **Error clarity:** % of diagnostics clicked → doc tooltip opened.

---

## 11) Risks & Mitigations

* **Spec drift** (libraries vs GitHub behavior): **Pin library versions** and surface a “Spec version” badge; track releases of `actions/languageservices`. ([GitHub][1])
* **Context availability complexity:** Use **explicit allowlists** drawn from GitHub Docs pages (e.g., `concurrency` and job `if` guidance) and keep them versioned. ([GitHub Docs][6])
* **WASM load time**: lazy‑load actionlint; show a small non‑blocking loader.

---

## 12) Open Questions (to track, not blockers)

* **Evaluation trace:** how deep should we go without forking `@actions/expressions`? (Start with context hits + resolved value; deeper AST views can come later.)
* **Globbing parity** for `hashFiles()` when workspace is provided (choose `picomatch` options to match runner’s behavior closely).
* **Context defaults:** how much of `github.*` should we prefill vs require manual input?

---

## 13) Rollout Plan (Front‑End Only)

**Phase 1 (MVP)**

* Editor + schema validation + actionlint WASM.
* Context Builder (env/vars/secrets/inputs/github basics).
* Ad‑hoc evaluator + Effective env viewer + context availability hints for top keys.
* Local export/share‑link (no secrets).

**Phase 2 (Nice‑to‑have)**

* Workspace upload to enable `hashFiles()`.
* Matrix and `needs` simulators; step status toggles for `success()/failure()/cancelled()`.

---

## 14) Dependencies

* `@actions/expressions`, `@actions/workflow-parser`, `@actions/languageservice` (from `actions/languageservices` repo; **MIT**; includes a **browser‑playground** reference). ([GitHub][1])
* actionlint (WASM) + typings; public playground confirms browser feasibility. ([rhysd.github.io][2])
* GitHub Docs for **expressions**, **contexts**, and **variables** as normative references. ([GitHub Docs][4])
* `workflow-v1.0.json` for schema. ([GitHub][3])
* (Optional) crypto/glob libs for `hashFiles()` when workspace is present.

---

## 15) Glossary

* **Contexts:** Namespaces like `github`, `env`, `vars`, etc., available in expressions `${{ ... }}`. ([GitHub Docs][11])
* **Expressions:** `${{ ... }}` syntax, operators and functions evaluated by the Actions expression engine. ([GitHub Docs][4])
* **Variables:** `env` (scoped), `vars` (config variables), `secrets` (masked). ([GitHub Docs][8])

---

### References (key sources)

* GitHub **actions/languageservices** (expressions, parser, language service, **browser‑playground**, **MIT**). ([GitHub][1])
* **actionlint** web playground & repo (WASM embedding). ([rhysd.github.io][2])
* Workflow schema JSON in the repo. ([GitHub][3])
* Expressions docs; Contexts reference; Variables reference. ([GitHub Docs][4])
* Runner ADR on `hashFiles()` requiring file access. ([GitHub][7])

---

If you’d like, I can also include a **one‑page UI wireframe** and a **dependency list with pinned versions** ready for `package.json`—all still front‑end only.

[1]: https://github.com/actions/languageservices "GitHub - actions/languageservices: Language services for GitHub Actions workflows and expressions."
[2]: https://rhysd.github.io/actionlint/?utm_source=chatgpt.com "actionlint playground - GitHub Pages"
[3]: https://github.com/actions/languageservices/blob/main/workflow-parser/src/workflow-v1.0.json?utm_source=chatgpt.com "languageservices/workflow-parser/src/workflow-v1.0.json at ... - GitHub"
[4]: https://docs.github.com/en/actions/reference/workflows-and-actions/expressions?utm_source=chatgpt.com "Evaluate expressions in workflows and actions - GitHub Docs"
[5]: https://www.npmjs.com/package/%40actions/languageservice?utm_source=chatgpt.com "@actions/languageservice - npm"
[6]: https://docs.github.com/actions/writing-workflows/choosing-what-your-workflow-does/control-the-concurrency-of-workflows-and-jobs?utm_source=chatgpt.com "Control the concurrency of workflows and jobs - GitHub Docs"
[7]: https://github.com/actions/runner/blob/main/docs/adrs/0279-hashFiles-expression-function.md?utm_source=chatgpt.com "ADR 0279: HashFiles Expression Function - GitHub"
[8]: https://docs.github.com/en/actions/reference/workflows-and-actions/variables?utm_source=chatgpt.com "Variables reference - GitHub Docs"
[9]: https://github.com/rhysd/actionlint?utm_source=chatgpt.com "GitHub - rhysd/actionlint: :octocat: Static checker for GitHub Actions ..."
[10]: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-jobs-with-conditions?utm_source=chatgpt.com "Using conditions to control job execution - GitHub Docs"
[11]: https://docs.github.com/en/actions/reference/workflows-and-actions/contexts?utm_source=chatgpt.com "Contexts reference - GitHub Docs"
