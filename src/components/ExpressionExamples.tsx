import React from 'react'

interface ExpressionExample {
  category: string
  title: string
  expression: string
  description: string
}

interface ExpressionExamplesProps {
  onSelectExample: (expression: string) => void
}

export const ExpressionExamples: React.FC<ExpressionExamplesProps> = ({ onSelectExample }) => {
  const examples: ExpressionExample[] = [
    // Common expressions from PRD
    {
      category: 'Branch & Event',
      title: 'Main Branch Check',
      expression: "github.ref == 'refs/heads/main'",
      description: 'Check if running on main branch'
    },
    {
      category: 'Branch & Event',
      title: 'Pull Request Event',
      expression: "github.event_name == 'pull_request'",
      description: 'Check if triggered by pull request'
    },
    {
      category: 'Branch & Event',
      title: 'Feature Branch',
      expression: "contains(github.ref, 'feature/')",
      description: 'Check if on a feature branch'
    },
    {
      category: 'Branch & Event',
      title: 'Tag Check',
      expression: "startsWith(github.ref, 'refs/tags/')",
      description: 'Check if triggered by a tag'
    },

    // Variables & Secrets
    {
      category: 'Variables & Secrets',
      title: 'Environment Variable with Default',
      expression: "env.NODE_VERSION || '16'",
      description: 'Get NODE_VERSION or default to 16'
    },
    {
      category: 'Variables & Secrets',
      title: 'Secret Exists',
      expression: "secrets.NPM_TOKEN != ''",
      description: 'Check if secret is set'
    },
    {
      category: 'Variables & Secrets',
      title: 'Format with Variables',
      expression: "format('v{0}.{1}', vars.MAJOR, vars.MINOR)",
      description: 'Build version string from config variables'
    },

    // String Functions
    {
      category: 'String Functions',
      title: 'Contains Check',
      expression: "contains(github.repository, 'octocat')",
      description: 'Check if repository contains string'
    },
    {
      category: 'String Functions',
      title: 'Starts With Branch',
      expression: "startsWith(github.ref, 'refs/heads/')",
      description: 'Check if reference is a branch'
    },
    {
      category: 'String Functions',
      title: 'Ends With',
      expression: "endsWith(github.ref, '/main')",
      description: 'Check if ref ends with /main'
    },

    // JSON Functions
    {
      category: 'JSON Functions',
      title: 'GitHub Context to JSON',
      expression: 'toJSON(github)',
      description: 'Convert entire github context to JSON'
    },
    {
      category: 'JSON Functions',
      title: 'Event Payload to JSON',
      expression: 'toJSON(github.event)',
      description: 'View full event payload as JSON'
    },
    {
      category: 'JSON Functions',
      title: 'Parse JSON String',
      expression: "fromJSON('{\"environment\": \"production\"}')",
      description: 'Parse JSON string to object'
    },

    // Status Functions
    {
      category: 'Status Functions',
      title: 'Success Check',
      expression: 'success()',
      description: 'Returns true if all previous steps succeeded (assumes success in evaluator)'
    },
    {
      category: 'Status Functions',
      title: 'Failure Check',
      expression: 'failure()',
      description: 'Returns true if any previous step failed'
    },
    {
      category: 'Status Functions',
      title: 'Always Run',
      expression: 'always()',
      description: 'Always returns true (for cleanup steps)'
    },
    {
      category: 'Status Functions',
      title: 'Cancelled Check',
      expression: 'cancelled()',
      description: 'Returns true if workflow was cancelled'
    },

    // Complex Expressions
    {
      category: 'Complex Examples',
      title: 'Production Deploy',
      expression: "github.ref == 'refs/heads/main' && env.APP_ENV == 'production'",
      description: 'Deploy only on main branch in production'
    },
    {
      category: 'Complex Examples',
      title: 'Multiple Events',
      expression: "github.event_name == 'push' || github.event_name == 'workflow_dispatch'",
      description: 'Run on push or manual trigger'
    },
    {
      category: 'Complex Examples',
      title: 'Conditional Message',
      expression: "format('Deploying {0} to {1}', github.sha, env.ENVIRONMENT || 'staging')",
      description: 'Build deployment message with fallback'
    },
    {
      category: 'Complex Examples',
      title: 'Tag Version Build',
      expression: "format('tag-{0}', vars.BUILD)",
      description: 'Create tag name from variable'
    }
  ]

  const groupedExamples = examples.reduce((acc, example) => {
    if (!acc[example.category]) {
      acc[example.category] = []
    }
    acc[example.category].push(example)
    return acc
  }, {} as Record<string, ExpressionExample[]>)

  return (
    <div className="expression-examples">
      <h3>Expression Examples</h3>
      <div className="examples-container">
        {Object.entries(groupedExamples).map(([category, categoryExamples]) => (
          <div key={category} className="example-category">
            <h4 className="category-title">{category}</h4>
            <div className="example-list">
              {categoryExamples.map((example, index) => (
                <div
                  key={index}
                  className="example-item"
                  onClick={() => onSelectExample(example.expression)}
                  title={example.description}
                >
                  <div className="example-title">{example.title}</div>
                  <code className="example-expression">{example.expression}</code>
                  <div className="example-description">{example.description}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}