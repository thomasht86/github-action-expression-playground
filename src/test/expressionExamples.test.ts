import { describe, it, expect, beforeEach } from 'vitest'
import { ExpressionEvaluator } from '../utils/expressionEvaluator'
import { EvaluationContext } from '../types'

describe('Expression Examples', () => {
  let evaluator: ExpressionEvaluator
  let context: EvaluationContext

  beforeEach(() => {
    // Create a realistic test context matching our app
    context = {
      env: {
        NODE_VERSION: '18',
        APP_ENV: 'production',
        TEST_ENV: 'test',
        DEPLOY: 'true',
        TARGET_ENV: 'staging',
        ENVIRONMENT: 'production'
      },
      vars: {
        BRANCH_NAME: 'main',
        DEPLOY_ENVIRONMENTS: '["production", "staging"]'
      },
      secrets: {
        DATABASE_URL: 'postgresql://localhost:5432/test',
        DEPLOY_KEY: 'secret-key-123'
      },
      inputs: {},
      github: {
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
      },
      matrix: {
        os: 'ubuntu-latest',
        node: '18'
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

    evaluator = new ExpressionEvaluator(context)
  })

  describe('Property Access Examples', () => {
    it('should evaluate github.ref', async () => {
      const result = await evaluator.evaluateExpression('github.ref')
      expect(result.value).toBe('refs/heads/main')
      expect(result.type).toBe('string')
      expect(result.contextHits).toContain('github.ref')
    })

    it('should evaluate env.NODE_VERSION', async () => {
      const result = await evaluator.evaluateExpression('env.NODE_VERSION')
      expect(result.value).toBe('18')
      expect(result.type).toBe('string')
      expect(result.contextHits).toContain('env.NODE_VERSION')
    })

    it('should evaluate vars.BRANCH_NAME', async () => {
      const result = await evaluator.evaluateExpression('vars.BRANCH_NAME')
      expect(result.value).toBe('main')
      expect(result.type).toBe('string')
      expect(result.contextHits).toContain('vars.BRANCH_NAME')
    })

    it('should evaluate secrets.DATABASE_URL', async () => {
      const result = await evaluator.evaluateExpression('secrets.DATABASE_URL')
      expect(result.value).toBe('postgresql://localhost:5432/test')
      expect(result.type).toBe('string')
      expect(result.contextHits).toContain('secrets.DATABASE_URL')
    })
  })

  describe('Comparison Examples', () => {
    it('should evaluate branch check', async () => {
      const result = await evaluator.evaluateExpression("github.ref == 'refs/heads/main'")
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
      expect(result.contextHits).toContain('github.ref')
    })

    it('should evaluate event type check', async () => {
      const result = await evaluator.evaluateExpression("github.event_name == 'push'")
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
      expect(result.contextHits).toContain('github.event_name')
    })

    it('should evaluate numeric comparison', async () => {
      const result = await evaluator.evaluateExpression('github.run_number > 10')
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
      expect(result.contextHits).toContain('github.run_number')
    })

    it('should evaluate environment check', async () => {
      const result = await evaluator.evaluateExpression("env.APP_ENV != 'development'")
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
      expect(result.contextHits).toContain('env.APP_ENV')
    })
  })

  describe('Logical Operations Examples', () => {
    it('should evaluate AND condition', async () => {
      const result = await evaluator.evaluateExpression("github.ref == 'refs/heads/main' && env.APP_ENV == 'production'")
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
      expect(result.contextHits).toContain('github.ref')
      expect(result.contextHits).toContain('env.APP_ENV')
    })

    it('should evaluate OR condition', async () => {
      const result = await evaluator.evaluateExpression("github.event_name == 'push' || github.event_name == 'workflow_dispatch'")
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
      expect(result.contextHits).toContain('github.event_name')
    })

    it('should evaluate negation', async () => {
      const result = await evaluator.evaluateExpression("!cancelled()")
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
      expect(result.contextHits).toContain('functions.cancelled')
    })
  })

  describe('String Functions Examples', () => {
    it('should evaluate contains check', async () => {
      const result = await evaluator.evaluateExpression("contains(github.repository, 'repo')")
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
      expect(result.contextHits).toContain('github.repository')
    })

    it('should evaluate starts with', async () => {
      const result = await evaluator.evaluateExpression("startsWith(github.ref, 'refs/heads/')")
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
      expect(result.contextHits).toContain('github.ref')
    })

    it('should evaluate ends with', async () => {
      const result = await evaluator.evaluateExpression("endsWith(github.ref, '/main')")
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
      expect(result.contextHits).toContain('github.ref')
    })
  })

  describe('Format Function Examples', () => {
    it('should evaluate string formatting', async () => {
      const result = await evaluator.evaluateExpression("format('Deploy to {0} environment', env.APP_ENV)")
      expect(result.value).toBe('Deploy to production environment')
      expect(result.type).toBe('string')
      expect(result.contextHits).toContain('env.APP_ENV')
    })

    it('should evaluate multiple variables formatting', async () => {
      const result = await evaluator.evaluateExpression("format('Build {0} on {1}', github.run_number, github.ref)")
      expect(result.value).toBe('Build 42 on refs/heads/main')
      expect(result.type).toBe('string')
      expect(result.contextHits).toContain('github.run_number')
      expect(result.contextHits).toContain('github.ref')
    })
  })

  describe('Status Functions Examples', () => {
    it('should evaluate success check', async () => {
      const result = await evaluator.evaluateExpression('success()')
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
      expect(result.contextHits).toContain('functions.success')
    })

    it('should evaluate always run', async () => {
      const result = await evaluator.evaluateExpression('always()')
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
      expect(result.contextHits).toContain('functions.always')
    })

    it('should evaluate failure check', async () => {
      const result = await evaluator.evaluateExpression('failure()')
      expect(result.value).toBe(false)
      expect(result.type).toBe('boolean')
      expect(result.contextHits).toContain('functions.failure')
    })

    it('should evaluate success with condition', async () => {
      const result = await evaluator.evaluateExpression("success() && env.DEPLOY == 'true'")
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
      expect(result.contextHits).toContain('functions.success')
      expect(result.contextHits).toContain('env.DEPLOY')
    })
  })

  describe('JSON Functions Examples', () => {
    it('should evaluate toJSON', async () => {
      const result = await evaluator.evaluateExpression('toJSON(github.event.repository.owner)')
      expect(result.value).toBe('{"login":"owner","id":987654321}')
      expect(result.type).toBe('string')
      expect(result.contextHits).toContain('github.event.repository.owner')
    })

    it('should evaluate fromJSON', async () => {
      const result = await evaluator.evaluateExpression('fromJSON(\'{"key": "value"}\').key')
      expect(result.value).toBe('value')
      expect(result.type).toBe('string')
    })
  })

  describe('Complex Examples', () => {
    it('should evaluate conditional deployment', async () => {
      const result = await evaluator.evaluateExpression("github.ref == 'refs/heads/main' && success() && !cancelled()")
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
      expect(result.contextHits).toContain('github.ref')
      expect(result.contextHits).toContain('functions.success')
      expect(result.contextHits).toContain('functions.cancelled')
    })

    it('should evaluate environment-based logic', async () => {
      const result = await evaluator.evaluateExpression("contains(fromJSON(vars.DEPLOY_ENVIRONMENTS), env.ENVIRONMENT)")
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
      expect(result.contextHits).toContain('vars.DEPLOY_ENVIRONMENTS')
      expect(result.contextHits).toContain('env.ENVIRONMENT')
    })

    it('should evaluate dynamic message', async () => {
      const result = await evaluator.evaluateExpression("format('🚀 Deploying {0} to {1} - Run #{2}', github.repository, env.TARGET_ENV, github.run_number)")
      expect(result.value).toBe('🚀 Deploying owner/repo to staging - Run #42')
      expect(result.type).toBe('string')
      expect(result.contextHits).toContain('github.repository')
      expect(result.contextHits).toContain('env.TARGET_ENV')
      expect(result.contextHits).toContain('github.run_number')
    })
  })

  describe('Additional Operator Tests', () => {
    it('should handle less than comparison', async () => {
      const result = await evaluator.evaluateExpression('github.run_number < 100')
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
    })

    it('should handle greater than or equal comparison', async () => {
      const result = await evaluator.evaluateExpression('github.run_number >= 40')
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
    })

    it('should handle less than or equal comparison', async () => {
      const result = await evaluator.evaluateExpression('github.run_number <= 50')
      expect(result.value).toBe(true)
      expect(result.type).toBe('boolean')
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid property access', async () => {
      const result = await evaluator.evaluateExpression('github.nonexistent')
      expect(result.error).toBeDefined()
      expect(result.type).toBe('error')
    })

    it('should handle invalid function calls', async () => {
      const result = await evaluator.evaluateExpression('invalidFunction()')
      expect(result.error).toBeDefined()
      expect(result.type).toBe('error')
    })

    it('should handle malformed JSON in fromJSON', async () => {
      const result = await evaluator.evaluateExpression('fromJSON("{invalid json")')
      expect(result.error).toBeDefined()
      expect(result.type).toBe('error')
    })
  })
})