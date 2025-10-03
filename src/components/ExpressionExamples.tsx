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
    // Basic Property Access
    {
      category: 'Property Access',
      title: 'GitHub Reference',
      expression: 'github.ref',
      description: 'Get the current branch or tag reference'
    },
    {
      category: 'Property Access',
      title: 'Environment Variable',
      expression: 'env.NODE_VERSION',
      description: 'Access an environment variable'
    },
    {
      category: 'Property Access',
      title: 'Configuration Variable',
      expression: 'vars.BRANCH_NAME',
      description: 'Access a repository configuration variable'
    },
    {
      category: 'Property Access',
      title: 'Secret Value',
      expression: 'secrets.DATABASE_URL',
      description: 'Access a secret (shown masked in real workflows)'
    },

    // Comparisons
    {
      category: 'Comparisons',
      title: 'Branch Check',
      expression: "github.ref == 'refs/heads/main'",
      description: 'Check if running on main branch'
    },
    {
      category: 'Comparisons',
      title: 'Event Type Check',
      expression: "github.event_name == 'push'",
      description: 'Check if triggered by push event'
    },
    {
      category: 'Comparisons',
      title: 'Numeric Comparison',
      expression: 'github.run_number > 10',
      description: 'Check if run number is greater than 10'
    },
    {
      category: 'Comparisons',
      title: 'Environment Check',
      expression: "env.APP_ENV != 'development'",
      description: 'Check if not in development environment'
    },

    // Logical Operations
    {
      category: 'Logical Operations',
      title: 'AND Condition',
      expression: "github.ref == 'refs/heads/main' && env.APP_ENV == 'production'",
      description: 'Deploy only on main branch in production'
    },
    {
      category: 'Logical Operations',
      title: 'OR Condition',
      expression: "github.event_name == 'push' || github.event_name == 'workflow_dispatch'",
      description: 'Run on push or manual trigger'
    },
    {
      category: 'Logical Operations',
      title: 'Negation',
      expression: "!cancelled()",
      description: 'Check if workflow was not cancelled'
    },

    // String Functions
    {
      category: 'String Functions',
      title: 'Contains Check',
      expression: "contains(github.repository, 'actions')",
      description: 'Check if repository name contains "actions"'
    },
    {
      category: 'String Functions',
      title: 'Starts With',
      expression: "startsWith(github.ref, 'refs/heads/')",
      description: 'Check if reference is a branch'
    },
    {
      category: 'String Functions',
      title: 'Ends With',
      expression: "endsWith(github.ref, '/main')",
      description: 'Check if reference ends with "/main"'
    },

    // Format Function
    {
      category: 'Format Function',
      title: 'String Formatting',
      expression: "format('Deploy to {0} environment', env.APP_ENV)",
      description: 'Create formatted string with variables'
    },
    {
      category: 'Format Function',
      title: 'Multiple Variables',
      expression: "format('Build {0} on {1}', github.run_number, github.ref)",
      description: 'Format string with multiple placeholders'
    },

    // Status Functions
    {
      category: 'Status Functions',
      title: 'Success Check',
      expression: 'success()',
      description: 'Check if all previous steps succeeded'
    },
    {
      category: 'Status Functions',
      title: 'Always Run',
      expression: 'always()',
      description: 'Always execute (for cleanup steps)'
    },
    {
      category: 'Status Functions',
      title: 'Failure Check',
      expression: 'failure()',
      description: 'Check if any previous step failed'
    },
    {
      category: 'Status Functions',
      title: 'Success with Condition',
      expression: "success() && env.DEPLOY == 'true'",
      description: 'Deploy only on success and when enabled'
    },

    // JSON Functions
    {
      category: 'JSON Functions',
      title: 'To JSON',
      expression: 'toJSON(github.event)',
      description: 'Convert object to JSON string'
    },
    {
      category: 'JSON Functions',
      title: 'From JSON',
      expression: "fromJSON('{\"key\": \"value\"}')",
      description: 'Parse JSON string to object'
    },

    // Complex Examples
    {
      category: 'Complex Examples',
      title: 'Conditional Deployment',
      expression: "github.ref == 'refs/heads/main' && success() && !cancelled()",
      description: 'Deploy on main branch if successful and not cancelled'
    },
    {
      category: 'Complex Examples',
      title: 'Environment-based Logic',
      expression: "contains(fromJSON(vars.DEPLOY_ENVIRONMENTS), env.ENVIRONMENT)",
      description: 'Check if current environment is in deploy list'
    },
    {
      category: 'Complex Examples',
      title: 'Dynamic Message',
      expression: "format('🚀 Deploying {0} to {1} - Run #{2}', github.repository, env.TARGET_ENV, github.run_number)",
      description: 'Create dynamic deployment message'
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