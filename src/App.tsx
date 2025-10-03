import { useState, useCallback, useEffect } from 'react'
import { Editor } from './components/Editor'
import { ContextBuilder } from './components/ContextBuilder'
import { ResultsPanel } from './components/ResultsPanel'
import { ImportExport } from './components/ImportExport'
import { ContextVariable, GitHubContext, ExpressionResult, ValidationError, EvaluationContext } from './types'
import { ExpressionEvaluator } from './utils/expressionEvaluator'
import { YAMLValidator } from './utils/yamlValidator'
import './App.css'

const defaultWorkflow = `name: Example Workflow
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: 18
  APP_ENV: production

jobs:
  test:
    runs-on: ubuntu-latest
    env:
      TEST_ENV: test
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: \${{ env.NODE_VERSION }}

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: \${{ secrets.DATABASE_URL }}

      - name: Deploy
        if: \${{ github.ref == 'refs/heads/main' && env.APP_ENV == 'production' }}
        run: echo "Deploying to production"
        env:
          DEPLOY_KEY: \${{ secrets.DEPLOY_KEY }}
`

function App() {
  const [workflowYaml, setWorkflowYaml] = useState(defaultWorkflow)
  const [variables, setVariables] = useState<ContextVariable[]>([
    { name: 'NODE_VERSION', value: '18', type: 'env', scope: 'workflow' },
    { name: 'APP_ENV', value: 'production', type: 'env', scope: 'workflow' },
    { name: 'TEST_ENV', value: 'test', type: 'env', scope: 'job' },
    { name: 'DATABASE_URL', value: 'postgresql://localhost:5432/test', type: 'secrets', scope: 'step' },
    { name: 'DEPLOY_KEY', value: 'secret-key-123', type: 'secrets', scope: 'step' },
    { name: 'BRANCH_NAME', value: 'main', type: 'vars', scope: 'workflow' },
  ])
  const [github, setGitHub] = useState<Partial<GitHubContext>>({
    repository: 'owner/repo',
    repository_owner: 'owner',
    ref: 'refs/heads/main',
    sha: 'abc123456789',
    event_name: 'push',
    actor: 'github-user',
    workflow: 'CI',
    job: 'build',
    run_id: '1234567890',
    run_number: '42',
    run_attempt: '1',
    api_url: 'https://api.github.com',
    server_url: 'https://github.com',
    graphql_url: 'https://api.github.com/graphql',
    workspace: '/github/workspace',
    action: '__self',
    head_ref: '',
    base_ref: '',
    token: '***',
    env: 'github-hosted',
    path: '',
    event: {
      ref: 'refs/heads/main',
      before: 'previous-commit-sha',
      after: 'abc123456789',
      repository: {
        id: 123456789,
        name: 'repo',
        full_name: 'owner/repo',
        owner: {
          login: 'owner',
          id: 987654321
        },
        default_branch: 'main',
        private: false
      },
      pusher: {
        name: 'github-user',
        email: 'user@example.com'
      },
      commits: [
        {
          id: 'abc123456789',
          message: 'Add new feature',
          author: {
            name: 'Developer',
            email: 'dev@example.com'
          }
        }
      ]
    }
  })
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [yamlValidator] = useState(() => new YAMLValidator())

  // Load state from URL fragment on component mount
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      try {
        const state = JSON.parse(atob(hash))
        if (state.workflow) setWorkflowYaml(state.workflow)
        if (state.variables) setVariables(state.variables)
        if (state.github) setGitHub(state.github)
        // Clear the hash after loading
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (error) {
        console.error('Failed to load state from URL:', error)
      }
    }
  }, [])

  // Auto-save to localStorage (excluding secrets)
  useEffect(() => {
    const state = {
      workflow: workflowYaml,
      variables: variables.filter(v => v.type !== 'secrets'),
      github
    }
    localStorage.setItem('github-actions-playground', JSON.stringify(state))
  }, [workflowYaml, variables, github])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('github-actions-playground')
    if (saved && !window.location.hash) {
      try {
        const state = JSON.parse(saved)
        if (state.workflow) setWorkflowYaml(state.workflow)
        if (state.variables) setVariables(state.variables)
        if (state.github) setGitHub(state.github)
      } catch (error) {
        console.error('Failed to load saved state:', error)
      }
    }
  }, [])

  // Validate YAML whenever it changes
  useEffect(() => {
    const errors = yamlValidator.validate(workflowYaml)
    setValidationErrors(errors)
  }, [workflowYaml, yamlValidator])

  const handleValidationErrors = useCallback((markers: any[]) => {
    // Monaco editor validation errors will be merged with YAML validation errors
    const monacoErrors: ValidationError[] = markers.map(marker => ({
      message: marker.message,
      line: marker.startLineNumber,
      column: marker.startColumn,
      severity: marker.severity === 8 ? 'error' : marker.severity === 4 ? 'warning' : 'info',
      source: 'schema'
    }))

    // Merge with existing YAML validation errors
    const yamlErrors = yamlValidator.validate(workflowYaml)
    setValidationErrors([...yamlErrors, ...monacoErrors])
  }, [workflowYaml, yamlValidator])

  const buildEvaluationContext = (): EvaluationContext => {
    const context: EvaluationContext = {
      env: {},
      vars: {},
      secrets: {},
      inputs: {},
      github: github as GitHubContext,
      matrix: {
        os: 'ubuntu-latest',
        node: '18',
        include: [
          { os: 'ubuntu-latest', node: '16' },
          { os: 'ubuntu-latest', node: '18' },
          { os: 'windows-latest', node: '18' }
        ]
      },
      needs: {
        build: {
          result: 'success',
          outputs: {
            version: '1.2.3',
            artifact_id: 'build-123'
          }
        }
      },
      runner: {
        name: 'GitHub Actions 2',
        os: 'Linux',
        arch: 'X64',
        temp: '/tmp',
        tool_cache: '/opt/hostedtoolcache',
        workspace: '/home/runner/work'
      },
      strategy: {
        fail_fast: true,
        job_index: 0,
        job_total: 3,
        max_parallel: 10
      }
    }

    variables.forEach(variable => {
      context[variable.type][variable.name] = variable.value
    })

    return context
  }

  const handleEvaluateExpression = async (expression: string): Promise<ExpressionResult> => {
    const context = buildEvaluationContext()
    const evaluator = new ExpressionEvaluator(context)
    return evaluator.evaluateExpression(expression)
  }

  const handleImport = (state: {
    workflow: string
    variables: ContextVariable[]
    github: Partial<GitHubContext>
  }) => {
    setWorkflowYaml(state.workflow)
    setVariables(state.variables)
    setGitHub(state.github)
  }

  return (
    <div className="playground-container">
      <div className="editor-panel">
        <div className="panel-header">
          Workflow Editor
          <ImportExport
            workflowYaml={workflowYaml}
            variables={variables}
            github={github}
            onImport={handleImport}
            onWorkflowChange={setWorkflowYaml}
          />
        </div>
        <Editor
          value={workflowYaml}
          onChange={setWorkflowYaml}
          onValidationErrors={handleValidationErrors}
        />
      </div>

      <div className="right-panel">
        <div className="context-panel">
          <ContextBuilder
            variables={variables}
            onVariablesChange={setVariables}
            github={github}
            onGitHubChange={setGitHub}
          />
        </div>

        <div className="results-panel">
          <ResultsPanel
            validationErrors={validationErrors}
            onEvaluateExpression={handleEvaluateExpression}
          />
        </div>
      </div>
    </div>
  )
}

export default App