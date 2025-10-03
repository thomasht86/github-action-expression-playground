# GitHub Actions Playground

A browser-based playground for experimenting with GitHub Actions expressions and variables. This front-end-only MVP provides instant feedback on YAML workflow validation and expression evaluation without requiring any backend infrastructure.

## Features

✅ **3-Pane Layout**
- Monaco Editor with YAML syntax highlighting
- Context & Variables Builder with tabbed interface
- Results & Insights panel with expression evaluator

✅ **Expression Evaluation**
- Real-time expression evaluation using custom parser
- Support for property access, comparisons, logical operations
- Context-aware evaluation (github, env, vars, secrets, etc.)
- Type information and context hits tracking

✅ **YAML Validation**
- GitHub Actions workflow schema validation
- Expression syntax validation
- Context availability checking (e.g., env not available in job-level if)

✅ **Context & Variables Management**
- Support for env, vars, secrets, inputs contexts
- Scoped variables (workflow/job/step levels)
- Override/precedence indicators
- GitHub context simulation

✅ **Import/Export**
- Export playground state (excluding secrets)
- Import workflow YAML files
- Share links via URL fragments
- Auto-save to localStorage (secrets excluded)

## Usage

### Expression Evaluator
Try these examples in the expression evaluator:

- `github.ref == 'refs/heads/main'`
- `env.NODE_VERSION`
- `contains(github.repository, 'owner')`
- `startsWith(github.ref, 'refs/heads/')`
- `success() && env.APP_ENV == 'production'`

### Context Variables
The playground supports these contexts:
- **env**: Environment variables (scoped: workflow → job → step)
- **vars**: Configuration variables (read-only, org/repo level)
- **secrets**: Masked secret values (never persisted)
- **inputs**: Workflow inputs for workflow_dispatch/reusable workflows
- **github**: GitHub context (repository, ref, event data, etc.)

### Validation
The playground validates:
- YAML syntax and structure
- GitHub Actions workflow schema compliance
- Expression syntax and balanced parentheses
- Context availability for specific workflow keys

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type check
npm run typecheck

# Lint code
npm run lint
```

## Architecture

- **TypeScript** + **React** for the UI
- **Monaco Editor** for code editing with YAML support
- **Custom Expression Evaluator** mimicking GitHub Actions behavior
- **YAML Validator** with schema and expression validation
- **Client-side only** - no backend required

## Planned Features

- [ ] actionlint WASM integration for enhanced static checks
- [ ] Workspace support for `hashFiles()` function
- [ ] Matrix and needs context builders
- [ ] Step status simulation for success()/failure() functions

## Based on PRD Requirements

This implementation follows the detailed Product Requirements Document for a GitHub Actions Expressions & Variables Playground, delivering:

1. **Accurate parsing & evaluation** of expressions with live feedback
2. **Great UX** for variable management and precedence visualization
3. **Inline validation** with schema and expression error checking
4. **Explainability** showing evaluation results and context sources
5. **Zero backend** architecture running entirely in the browser

The playground provides an excellent environment for action authors, CI owners, and learners to safely experiment with GitHub Actions expressions and understand their behavior.