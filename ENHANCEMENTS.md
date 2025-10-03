# GitHub Actions Playground - Enhanced Features

## 🚀 Enhanced Expression Support

The expression evaluator now supports the complete GitHub Actions syntax as specified in the official documentation:

### ✅ Operators
- **Comparison**: `==`, `!=`, `>`, `<`, `>=`, `<=`
- **Logical**: `&&`, `||`, `!` (negation)
- **Property Access**: `.` (dot notation)

### ✅ Functions

#### String Functions
- `contains(search, item)` - Check if item exists in search string
- `startsWith(searchString, searchValue)` - Check if string starts with value
- `endsWith(searchString, searchValue)` - Check if string ends with value

#### Format Function
- `format(string, replaceValue0, ...)` - Replace placeholders in string
  - Example: `format('Hello {0} {1}', 'Mona', 'the')` → `'Hello Mona the'`

#### JSON Functions
- `toJSON(value)` - Convert value to JSON string representation
- `fromJSON(value)` - Parse JSON string to object/value

#### Status Functions
- `success()` - Returns true if all previous steps succeeded
- `failure()` - Returns true if any previous step failed
- `always()` - Always returns true (for cleanup steps)
- `cancelled()` - Returns true if workflow was cancelled

### ✅ Comprehensive Context Support

#### `github` Context
Full GitHub context with realistic properties:
- `github.repository`, `github.repository_owner`
- `github.ref`, `github.sha`, `github.event_name`
- `github.actor`, `github.workflow`, `github.job`
- `github.run_id`, `github.run_number`, `github.run_attempt`
- `github.event` - Complete event payload with repository, commits, pusher info

#### `runner` Context
- `runner.name`, `runner.os`, `runner.arch`
- `runner.temp`, `runner.tool_cache`, `runner.workspace`

#### `matrix` Context
- `matrix.os`, `matrix.node`
- `matrix.include` - Array of matrix combinations

#### `needs` Context
- `needs.<job_id>.result` - Job result status
- `needs.<job_id>.outputs.<output_name>` - Job outputs

#### `strategy` Context
- `strategy.fail_fast`, `strategy.job_index`
- `strategy.job_total`, `strategy.max_parallel`

## 🎯 Interactive Expression Examples

### Clickable Examples by Category

#### **Property Access**
- `github.ref` - Current branch/tag reference
- `env.NODE_VERSION` - Environment variable access
- `vars.BRANCH_NAME` - Configuration variable access
- `secrets.DATABASE_URL` - Secret access (masked)

#### **Comparisons**
- `github.ref == 'refs/heads/main'` - Branch checking
- `github.event_name == 'push'` - Event type checking
- `github.run_number > 10` - Numeric comparisons
- `env.APP_ENV != 'development'` - Inequality checks

#### **Logical Operations**
- `github.ref == 'refs/heads/main' && env.APP_ENV == 'production'` - AND conditions
- `github.event_name == 'push' || github.event_name == 'workflow_dispatch'` - OR conditions
- `!cancelled()` - Negation

#### **String Functions**
- `contains(github.repository, 'actions')` - String contains check
- `startsWith(github.ref, 'refs/heads/')` - String starts with
- `endsWith(github.ref, '/main')` - String ends with

#### **Format Function**
- `format('Deploy to {0} environment', env.APP_ENV)` - String formatting
- `format('Build {0} on {1}', github.run_number, github.ref)` - Multiple variables

#### **Status Functions**
- `success()` - All steps succeeded
- `always()` - Always execute
- `failure()` - Any step failed
- `success() && env.DEPLOY == 'true'` - Conditional deployment

#### **JSON Functions**
- `toJSON(github.event)` - Object to JSON conversion
- `fromJSON('{"key": "value"}')` - JSON parsing

#### **Complex Examples**
- `github.ref == 'refs/heads/main' && success() && !cancelled()` - Multi-condition deployment
- `contains(fromJSON(vars.DEPLOY_ENVIRONMENTS), env.ENVIRONMENT)` - JSON-based logic
- `format('🚀 Deploying {0} to {1} - Run #{2}', github.repository, env.TARGET_ENV, github.run_number)` - Dynamic messaging

## 🎨 Enhanced User Experience

### Interactive Features
- **Click to Try**: All examples are clickable and immediately populate the evaluator
- **Auto-Evaluation**: Selected examples are automatically evaluated
- **Categorized Examples**: Examples organized by functionality for easy discovery
- **Hover Descriptions**: Detailed explanations for each example

### Visual Improvements
- **Syntax Highlighting**: Expression syntax highlighted in examples
- **Category Headers**: Clear organization with color-coded sections
- **Responsive Design**: Examples scroll independently with fixed height
- **Hover Effects**: Interactive feedback on clickable elements

## 🔧 Technical Improvements

### Expression Parser Enhancements
- **Argument Parsing**: Proper handling of function arguments with nested parentheses and quotes
- **Operator Precedence**: Correct evaluation order for complex expressions
- **Error Handling**: Clear error messages for invalid syntax
- **Type Safety**: Proper type inference and validation

### Context Fidelity
- **Realistic Data**: All context values match GitHub Actions runtime behavior
- **Nested Objects**: Full support for complex object structures in event payloads
- **Array Handling**: Proper evaluation of array properties and indexing

## 📚 Usage

The playground now supports the complete GitHub Actions expression syntax. Users can:

1. **Explore Examples**: Browse categorized examples to understand different expression types
2. **Interactive Learning**: Click any example to see immediate evaluation results
3. **Experiment Freely**: Modify examples or create custom expressions
4. **Validate Syntax**: Real-time validation with detailed error messages
5. **Understand Context**: See which context values are accessed during evaluation

This comprehensive implementation makes the playground an excellent learning and testing environment for GitHub Actions expressions.