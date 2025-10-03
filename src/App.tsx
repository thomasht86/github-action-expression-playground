import { useState, useEffect } from 'react'
import { ExpressionInput } from './components/ExpressionInput'
import { ContextBuilder } from './components/ContextBuilder'
import { QuickContextSelector } from './components/QuickContextSelector'
import { ContextVariable, GitHubContext, ExpressionResult, EvaluationContext } from './types'
import { ExpressionEvaluator } from './utils/expressionEvaluator'
import './App.css'

function App() {
  const [variables, setVariables] = useState<ContextVariable[]>([
    // Default variables for examples
    { name: 'NODE_VERSION', value: '16', type: 'env', scope: 'workflow' },
    { name: 'APP_ENV', value: 'production', type: 'env', scope: 'workflow' },
    { name: 'ENVIRONMENT', value: 'staging', type: 'env', scope: 'workflow' },
    { name: 'MAJOR', value: '1', type: 'vars', scope: 'workflow' },
    { name: 'MINOR', value: '2', type: 'vars', scope: 'workflow' },
    { name: 'BUILD', value: 'prod', type: 'vars', scope: 'workflow' },
    { name: 'NPM_TOKEN', value: 'npm_secret_token_123', type: 'secrets', scope: 'workflow' },
  ])
  const [github, setGitHub] = useState<Partial<GitHubContext>>({
    repository: 'octocat/hello-world',
    repository_owner: 'octocat',
    ref: 'refs/heads/main',
    ref_name: 'main',
    ref_type: 'branch',
    sha: 'ffac537e6cbbf934b08745a378932722df287a53',
    event_name: 'push',
    actor: 'octocat',
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
      before: '0000000000000000000000000000000000000000',
      after: 'ffac537e6cbbf934b08745a378932722df287a53',
      repository: {
        id: 123456789,
        name: 'hello-world',
        full_name: 'octocat/hello-world',
        owner: {
          login: 'octocat',
          id: 1
        },
        default_branch: 'main',
        private: false
      },
      pusher: {
        name: 'octocat',
        email: 'octocat@github.com'
      },
      commits: [
        {
          id: 'ffac537e6cbbf934b08745a378932722df287a53',
          message: 'Update README.md',
          author: {
            name: 'octocat',
            email: 'octocat@github.com'
          }
        }
      ]
    }
  })

  // Load state from URL fragment on component mount
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      try {
        const state = JSON.parse(atob(hash))
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
      variables: variables.filter(v => v.type !== 'secrets'),
      github
    }
    localStorage.setItem('github-expressions-evaluator', JSON.stringify(state))
  }, [variables, github])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('github-expressions-evaluator')
    if (saved && !window.location.hash) {
      try {
        const state = JSON.parse(saved)
        if (state.variables) setVariables(state.variables)
        if (state.github) setGitHub(state.github)
      } catch (error) {
        console.error('Failed to load saved state:', error)
      }
    }
  }, [])

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

  const handleShareLink = () => {
    const state = {
      variables: variables.filter(v => v.type !== 'secrets'),
      github
    }
    const encoded = btoa(JSON.stringify(state))
    const url = `${window.location.origin}${window.location.pathname}#${encoded}`
    window.open(url, '_blank')
  }

  return (
    <div className="evaluator-container">
      <header className="app-header">
        <h1>GitHub Actions Expression Evaluator</h1>
        <div className="header-actions">
          <button onClick={handleShareLink} className="share-button">
            🔗 Share
          </button>
        </div>
      </header>

      <QuickContextSelector
        github={github}
        onGitHubChange={setGitHub}
      />

      <div className="main-content">
        <div className="left-panel">
          <ExpressionInput
            onEvaluate={handleEvaluateExpression}
          />
        </div>

        <div className="right-panel">
          <ContextBuilder
            variables={variables}
            onVariablesChange={setVariables}
            github={github}
            onGitHubChange={setGitHub}
          />
        </div>
      </div>
    </div>
  )
}

export default App