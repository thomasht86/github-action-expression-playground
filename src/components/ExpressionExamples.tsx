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

    // Deep Context Access
    {
      category: 'Deep Context Access',
      title: 'Repository Owner',
      expression: "github.event.repository.owner.login",
      description: 'Access nested repository owner login'
    },
    {
      category: 'Deep Context Access',
      title: 'Commit Author Email',
      expression: "github.event.pusher.email",
      description: 'Get the email of the person who pushed'
    },
    {
      category: 'Deep Context Access',
      title: 'Runner Architecture',
      expression: "runner.arch",
      description: 'Get the architecture of the runner (X64, ARM64, etc.)'
    },
    {
      category: 'Deep Context Access',
      title: 'Strategy Job Index',
      expression: "strategy.job_index",
      description: 'Get the index of the current job in a matrix'
    },

    // Advanced JSON Operations
    {
      category: 'Advanced JSON',
      title: 'Parse JSON Array String',
      expression: "toJSON(fromJSON('[\"ubuntu-latest\", \"windows-latest\", \"macos-latest\"]'))",
      description: 'Parse JSON array and convert back to string'
    },
    {
      category: 'Advanced JSON',
      title: 'Check Array Membership',
      expression: "contains(toJSON(fromJSON('[\"push\", \"pull_request\"]')), github.event_name)",
      description: 'Check if event is in allowed list using JSON'
    },
    {
      category: 'Advanced JSON',
      title: 'Parse Config Object',
      expression: "contains(toJSON(fromJSON('{\"deploy\": true}')), 'deploy')",
      description: 'Parse JSON and check for property'
    },
    {
      category: 'Advanced JSON',
      title: 'Nested JSON Object',
      expression: "toJSON(fromJSON('{\"env\": {\"prod\": \"api.prod.com\"}}'))",
      description: 'Parse and re-stringify nested JSON object'
    },

    // Multi-step Logic
    {
      category: 'Complex Examples',
      title: 'Multi-condition Branch Check',
      expression: "github.event_name == 'push' && startsWith(github.ref, 'refs/heads/')",
      description: 'Combine conditions to filter branch pushes'
    },
    {
      category: 'Complex Examples',
      title: 'Production Deployment Gate',
      expression: "github.ref == 'refs/heads/main' && success()",
      description: 'Check conditions before production deploy'
    },
    {
      category: 'Complex Examples',
      title: 'Version from Job Output',
      expression: "format('v{0}-{1}', needs.build.outputs.version, github.run_number)",
      description: 'Combine job output with run number for versioning'
    },
    {
      category: 'Complex Examples',
      title: 'Dynamic Environment Name',
      expression: "format('{0}-{1}-{2}', matrix.os, matrix.node, github.sha)",
      description: 'Build environment name from matrix and commit'
    },
    {
      category: 'Complex Examples',
      title: 'Branch-based Configuration',
      expression: "contains(github.ref, 'release/') || contains(github.ref, 'main')",
      description: 'Check if branch is a release or main branch'
    },
    {
      category: 'Complex Examples',
      title: 'Secret Validation',
      expression: "secrets.DEPLOY_KEY != ''",
      description: 'Ensure secret exists before deployment'
    },
    {
      category: 'Complex Examples',
      title: 'Array Contains via JSON',
      expression: "contains(toJSON(fromJSON(vars.DEPLOY_ENVIRONMENTS)), env.ENVIRONMENT)",
      description: 'Check if environment is in deployment list'
    },
    {
      category: 'Complex Examples',
      title: 'Event Metadata Format',
      expression: "format('🚀 {0}@{1} by @{2}', github.repository, github.sha, github.actor)",
      description: 'Build rich deployment message with emojis'
    },
    {
      category: 'Complex Examples',
      title: 'Branch and Event Check',
      expression: "startsWith(github.ref, 'refs/heads/') && github.event_name == 'push'",
      description: 'Verify branch push conditions'
    },
    {
      category: 'Complex Examples',
      title: 'Fallback Values',
      expression: "env.NODE_VERSION != '' && env.NODE_VERSION || '18'",
      description: 'Use environment variable with fallback'
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