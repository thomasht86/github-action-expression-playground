export interface GitHubContext {
  action: string
  actor: string
  api_url: string
  base_ref: string
  env: string
  event: Record<string, any>
  event_name: string
  event_path: string
  graphql_url: string
  head_ref: string
  job: string
  path: string
  ref: string
  repository: string
  repository_owner: string
  run_id: string
  run_number: string
  run_attempt: string
  server_url: string
  sha: string
  token: string
  workflow: string
  workspace: string
}

export interface ContextVariable {
  name: string
  value: string
  type: 'env' | 'vars' | 'secrets' | 'inputs'
  scope: 'workflow' | 'job' | 'step'
}

export interface EvaluationContext {
  env: Record<string, string>
  vars: Record<string, string>
  secrets: Record<string, string>
  inputs: Record<string, string>
  github: Partial<GitHubContext>
  matrix: Record<string, any>
  needs: Record<string, any>
  runner: Record<string, any>
  strategy: Record<string, any>
}

export interface ExpressionResult {
  value: any
  type: string
  contextHits: string[]
  error?: string
}

export interface ValidationError {
  message: string
  line: number
  column: number
  severity: 'error' | 'warning' | 'info'
  source: 'schema' | 'actionlint' | 'expression'
}