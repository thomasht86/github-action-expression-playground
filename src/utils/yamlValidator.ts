import { ValidationError } from '../types'
import * as YAML from 'yaml'

// GitHub Actions workflow schema validation
export class YAMLValidator {
  constructor() {
    // Basic GitHub Actions workflow schema
    // In a real implementation, this would use the official workflow-v1.0.json schema
    // Schema would be used for more advanced validation
  }

  validate(yamlContent: string): ValidationError[] {
    const errors: ValidationError[] = []

    try {
      // First, check if it's valid YAML
      const doc = YAML.parseDocument(yamlContent)

      if (doc.errors.length > 0) {
        doc.errors.forEach(error => {
          const pos = error.pos?.[0] || 0
          const line = this.getLineFromPosition(yamlContent, pos)

          errors.push({
            message: error.message,
            line: line,
            column: 1,
            severity: 'error',
            source: 'schema'
          })
        })
        return errors
      }

      const parsed = doc.toJS()

      // Basic workflow validation
      if (!parsed.name) {
        errors.push({
          message: 'Workflow must have a name',
          line: 1,
          column: 1,
          severity: 'error',
          source: 'schema'
        })
      }

      if (!parsed.on) {
        errors.push({
          message: 'Workflow must specify trigger events (on)',
          line: 1,
          column: 1,
          severity: 'error',
          source: 'schema'
        })
      }

      if (!parsed.jobs || typeof parsed.jobs !== 'object') {
        errors.push({
          message: 'Workflow must have at least one job',
          line: 1,
          column: 1,
          severity: 'error',
          source: 'schema'
        })
      } else {
        // Validate each job
        Object.entries(parsed.jobs).forEach(([jobId, job]: [string, any]) => {
          if (!job['runs-on']) {
            errors.push({
              message: `Job '${jobId}' must specify 'runs-on'`,
              line: 1,
              column: 1,
              severity: 'error',
              source: 'schema'
            })
          }

          // Validate job ID format
          if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(jobId)) {
            errors.push({
              message: `Job ID '${jobId}' is invalid. Must start with a letter or underscore, followed by alphanumeric characters, underscores, or hyphens`,
              line: 1,
              column: 1,
              severity: 'error',
              source: 'schema'
            })
          }

          // Validate steps if present
          if (job.steps && Array.isArray(job.steps)) {
            job.steps.forEach((step: any, index: number) => {
              if (!step.uses && !step.run) {
                errors.push({
                  message: `Step ${index + 1} in job '${jobId}' must have either 'uses' or 'run'`,
                  line: 1,
                  column: 1,
                  severity: 'error',
                  source: 'schema'
                })
              }
            })
          }
        })
      }

      // Validate expressions in the workflow
      this.validateExpressions(parsed, errors)

    } catch (error) {
      errors.push({
        message: error instanceof Error ? error.message : 'Unknown parsing error',
        line: 1,
        column: 1,
        severity: 'error',
        source: 'schema'
      })
    }

    return errors
  }

  private validateExpressions(obj: any, errors: ValidationError[], path: string = ''): void {
    if (typeof obj === 'string') {
      // Check for expressions
      const expressionMatches = obj.match(/\$\{\{[^}]+\}\}/g)
      if (expressionMatches) {
        expressionMatches.forEach(expr => {
          this.validateExpression(expr, errors, path)
        })
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        this.validateExpressions(item, errors, `${path}[${index}]`)
      })
    } else if (obj && typeof obj === 'object') {
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = path ? `${path}.${key}` : key
        this.validateExpressions(value, errors, newPath)

        // Check context availability for specific keys
        if (typeof value === 'string' && value.includes('${{')) {
          this.validateContextAvailability(key, value, errors)
        }
      })
    }
  }

  private validateExpression(expression: string, errors: ValidationError[], path: string): void {
    // Basic expression syntax validation
    const cleanExpr = expression.replace(/^\$\{\{\s*/, '').replace(/\s*\}\}$/, '').trim()

    if (!cleanExpr) {
      errors.push({
        message: 'Empty expression',
        line: 1,
        column: 1,
        severity: 'error',
        source: 'expression'
      })
      return
    }

    // Check for balanced parentheses
    let parenCount = 0
    for (const char of cleanExpr) {
      if (char === '(') parenCount++
      if (char === ')') parenCount--
      if (parenCount < 0) {
        errors.push({
          message: 'Unbalanced parentheses in expression',
          line: 1,
          column: 1,
          severity: 'error',
          source: 'expression'
        })
        return
      }
    }
    if (parenCount !== 0) {
      errors.push({
        message: 'Unbalanced parentheses in expression',
        line: 1,
        column: 1,
        severity: 'error',
        source: 'expression'
      })
    }

    // Check for common syntax errors
    if (cleanExpr.includes('===') || cleanExpr.includes('!==')) {
      errors.push({
        message: 'Use == or != for comparisons, not === or !==',
        line: 1,
        column: 1,
        severity: 'warning',
        source: 'expression'
      })
    }

    // Silence unused parameter warning
    console.debug('Validating expression at path:', path)
  }

  private validateContextAvailability(key: string, value: string, errors: ValidationError[]): void {
    // Context availability rules based on GitHub documentation
    const contextRules: Record<string, string[]> = {
      'if': ['github', 'inputs', 'vars', 'needs', 'strategy', 'matrix'],
      'concurrency': ['github', 'inputs', 'vars', 'needs', 'strategy', 'matrix'],
      'timeout-minutes': ['github', 'inputs', 'vars', 'needs', 'strategy', 'matrix'],
      'continue-on-error': ['github', 'inputs', 'vars', 'needs', 'strategy', 'matrix', 'steps'],
    }

    // Check if this key has context restrictions
    if (contextRules[key]) {
      const allowedContexts = contextRules[key]
      const usedContexts = this.extractContextsFromExpression(value)

      usedContexts.forEach(context => {
        if (!allowedContexts.includes(context)) {
          errors.push({
            message: `Context '${context}' is not available in '${key}'. Allowed contexts: ${allowedContexts.join(', ')}`,
            line: 1,
            column: 1,
            severity: 'warning',
            source: 'expression'
          })
        }
      })
    }

    // Special case: env context is not available in job-level if
    if (key === 'if' && value.includes('env.')) {
      errors.push({
        message: "The 'env' context is not available in job-level 'if' conditions",
        line: 1,
        column: 1,
        severity: 'warning',
        source: 'expression'
      })
    }
  }

  private extractContextsFromExpression(expression: string): string[] {
    const contexts: string[] = []
    const matches = expression.match(/\b(github|env|vars|secrets|inputs|matrix|needs|runner|strategy|steps)\b/g)
    if (matches) {
      contexts.push(...new Set(matches))
    }
    return contexts
  }

  private getLineFromPosition(content: string, position: number): number {
    const lines = content.substring(0, position).split('\n')
    return lines.length
  }
}