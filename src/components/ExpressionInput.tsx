import { useState, useEffect, useRef } from 'react'
import { Editor as MonacoEditor } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { ClipboardDocumentListIcon, BeakerIcon } from '@heroicons/react/24/outline'
import { ExpressionResult } from '../types'

interface ExpressionExample {
  category: string
  title: string
  expression: string
}

interface ExpressionInputProps {
  onEvaluate: (expression: string) => Promise<ExpressionResult>
}

const EXAMPLES: ExpressionExample[] = [
  { category: 'Branch & Event', title: 'Main Branch Check', expression: "github.ref == 'refs/heads/main'" },
  { category: 'Branch & Event', title: 'Pull Request Event', expression: "github.event_name == 'pull_request'" },
  { category: 'Branch & Event', title: 'Feature Branch', expression: "contains(github.ref, 'feature/')" },
  { category: 'Branch & Event', title: 'Tag Check', expression: "startsWith(github.ref, 'refs/tags/')" },
  { category: 'Branch & Event', title: 'Repository Name', expression: "github.repository" },
  { category: 'Branch & Event', title: 'Commit SHA', expression: "github.sha" },
  { category: 'Variables & Secrets', title: 'Environment Variable', expression: "env.NODE_VERSION" },
  { category: 'Variables & Secrets', title: 'Environment Variable with Default', expression: "env.NODE_VERSION || '16'" },
  { category: 'Variables & Secrets', title: 'Secret Exists', expression: "secrets.NPM_TOKEN != ''" },
  { category: 'Variables & Secrets', title: 'Configuration Variable', expression: "vars.MAJOR" },
  { category: 'String Functions', title: 'Contains Check', expression: "contains(github.repository, 'octocat')" },
  { category: 'String Functions', title: 'Starts With Branch', expression: "startsWith(github.ref, 'refs/heads/')" },
  { category: 'String Functions', title: 'Ends With', expression: "endsWith(github.ref, '/main')" },
  { category: 'String Functions', title: 'Format SHA', expression: "format('Build {0}', github.sha)" },
  { category: 'String Functions', title: 'Format Multiple Values', expression: "format('Repo: {0}, Branch: {1}', github.repository, github.ref_name)" },
  { category: 'JSON Functions', title: 'GitHub Context to JSON', expression: 'toJSON(github)' },
  { category: 'JSON Functions', title: 'Event Payload to JSON', expression: 'toJSON(github.event)' },
  { category: 'JSON Functions', title: 'Env Variables to JSON', expression: 'toJSON(env)' },
  { category: 'JSON Functions', title: 'Parse JSON String', expression: 'fromJSON(\'{"include":[{"project":"foo","config":"Debug"}]}\')' },
  { category: 'Matrix Strategy', title: 'Matrix OS Value', expression: "matrix.os" },
  { category: 'Matrix Strategy', title: 'Matrix Node Version', expression: "matrix.node" },
  { category: 'Matrix Strategy', title: 'Matrix to JSON', expression: "toJSON(matrix)" },
  { category: 'Matrix Strategy', title: 'Check Matrix OS', expression: "matrix.os == 'ubuntu-latest'" },
  { category: 'Matrix Strategy', title: 'Matrix Node Version Check', expression: "matrix.node == '18' || matrix.node == '20'" },
  { category: 'Complex Conditions', title: 'Production Deploy Check', expression: "github.ref == 'refs/heads/main' && env.APP_ENV == 'production'" },
  { category: 'Complex Conditions', title: 'Multiple Events', expression: "github.event_name == 'push' || github.event_name == 'workflow_dispatch'" },
  { category: 'Complex Conditions', title: 'Conditional Output', expression: "github.ref == 'refs/heads/main' && 'Deploy' || 'Skip'" },
  { category: 'Complex Conditions', title: 'Tag or Main Branch', expression: "startsWith(github.ref, 'refs/tags/') || github.ref == 'refs/heads/main'" }
]

export function ExpressionInput({ onEvaluate }: ExpressionInputProps) {
  const [expression, setExpression] = useState("github.ref == 'refs/heads/main'")
  const [result, setResult] = useState<ExpressionResult | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof monaco | null>(null)

  useEffect(() => {
    const evaluateExpression = async () => {
      // Don't evaluate empty expressions
      if (!expression || expression.trim() === '') {
        setResult(null)
        setIsEvaluating(false)
        return
      }

      setIsEvaluating(true)
      try {
        const result = await onEvaluate(expression)
        setResult(result)
      } catch (error) {
        setResult({
          value: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      } finally {
        setIsEvaluating(false)
      }
    }

    const debounceTimer = setTimeout(evaluateExpression, 100)
    return () => clearTimeout(debounceTimer)
  }, [expression, onEvaluate])

  const handleCopy = async () => {
    if (result?.success && result.value !== undefined) {
      const textToCopy = typeof result.value === 'string'
        ? result.value
        : JSON.stringify(result.value, null, 2)

      try {
        await navigator.clipboard.writeText(textToCopy)
        setShowCopyNotification(true)
        setTimeout(() => setShowCopyNotification(false), 2000)
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
      }
    }
  }

  const getValueType = (value: any): string => {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    return typeof value
  }

  const formatValue = (value: any): string => {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return `"${value}"`
    if (typeof value === 'object') return JSON.stringify(value, null, 2)
    return String(value)
  }

  const groupedExamples = EXAMPLES.reduce((acc, example) => {
    if (!acc[example.category]) {
      acc[example.category] = []
    }
    acc[example.category].push(example)
    return acc
  }, {} as Record<string, ExpressionExample[]>)

  const handleExampleSelect = (selectedExpression: string) => {
    if (selectedExpression) {
      setExpression(selectedExpression)
    }
  }

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
    editorRef.current = editor
    monacoRef.current = monacoInstance

    // Register custom language for GitHub Actions expressions
    monacoInstance.languages.register({ id: 'github-expression' })

    // Define syntax highlighting
    monacoInstance.languages.setMonarchTokensProvider('github-expression', {
      tokenizer: {
        root: [
          // Functions (must come before general identifiers)
          [/\b(contains|startsWith|endsWith|format|join|toJSON|fromJSON|hashFiles)\b/, 'entity.name.function'],

          // Contexts
          [/\b(github|env|vars|secrets|inputs|needs|strategy|matrix|runner|job|steps)\b/, 'variable.language'],

          // Operators
          [/==|!=|<|>|<=|>=/, 'keyword.operator'],
          [/&&|\|\||!/, 'keyword.operator'],

          // Strings
          [/'[^']*'/, 'string'],
          [/"[^"]*"/, 'string'],

          // Numbers
          [/\d+/, 'number'],

          // Properties
          [/\.\w+/, 'support.type'],
        ],
      },
    })

    // Define language configuration
    monacoInstance.languages.setLanguageConfiguration('github-expression', {
      brackets: [
        ['(', ')'],
        ['[', ']'],
        ['{', '}'],
      ],
      autoClosingPairs: [
        { open: '(', close: ')' },
        { open: '[', close: ']' },
        { open: '{', close: '}' },
        { open: "'", close: "'" },
        { open: '"', close: '"' },
      ],
    })

    // Register autocomplete provider
    monacoInstance.languages.registerCompletionItemProvider('github-expression', {
      provideCompletionItems: (model, position) => {
        const textUntilPosition = model.getValueInRange({
          startLineNumber: position.lineNumber,
          startColumn: 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        })

        const word = model.getWordUntilPosition(position)
        const range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: position.column,
        }

        const suggestions: monaco.languages.CompletionItem[] = []

        // Check if we're after a dot (for property access)
        const lastDotIndex = textUntilPosition.lastIndexOf('.')
        const isAfterDot = lastDotIndex > -1 && lastDotIndex === textUntilPosition.length - 1 - word.word.length

        if (isAfterDot) {
          // Get the context before the dot
          const textBeforeDot = textUntilPosition.substring(0, lastDotIndex)
          const contextMatch = textBeforeDot.match(/(\w+)$/)
          const context = contextMatch ? contextMatch[1] : ''

          if (context === 'github') {
            suggestions.push(
              { label: 'ref', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'ref', range, documentation: 'Git ref (e.g., refs/heads/main)' },
              { label: 'ref_name', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'ref_name', range, documentation: 'Branch or tag name' },
              { label: 'ref_type', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'ref_type', range, documentation: 'Type of ref (branch or tag)' },
              { label: 'event_name', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'event_name', range, documentation: 'Event that triggered workflow' },
              { label: 'repository', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'repository', range, documentation: 'Repository name (owner/repo)' },
              { label: 'repository_owner', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'repository_owner', range, documentation: 'Repository owner' },
              { label: 'sha', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'sha', range, documentation: 'Commit SHA' },
              { label: 'actor', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'actor', range, documentation: 'User that triggered workflow' },
              { label: 'workflow', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'workflow', range, documentation: 'Workflow name' },
              { label: 'job', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'job', range, documentation: 'Job ID' },
              { label: 'run_id', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'run_id', range, documentation: 'Workflow run ID' },
              { label: 'run_number', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'run_number', range, documentation: 'Workflow run number' },
              { label: 'event', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'event', range, documentation: 'Event payload object' },
              { label: 'base_ref', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'base_ref', range, documentation: 'Base ref for PR' },
              { label: 'head_ref', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'head_ref', range, documentation: 'Head ref for PR' }
            )
          } else if (context === 'runner') {
            suggestions.push(
              { label: 'name', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'name', range, documentation: 'Runner name' },
              { label: 'os', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'os', range, documentation: 'Runner OS' },
              { label: 'arch', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'arch', range, documentation: 'Runner architecture' },
              { label: 'temp', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'temp', range, documentation: 'Temp directory path' },
              { label: 'tool_cache', kind: monacoInstance.languages.CompletionItemKind.Property, insertText: 'tool_cache', range, documentation: 'Tool cache directory' }
            )
          }
        } else {
          // Contexts
          suggestions.push(
            { label: 'github', kind: monacoInstance.languages.CompletionItemKind.Variable, insertText: 'github', range, documentation: 'GitHub context' },
            { label: 'env', kind: monacoInstance.languages.CompletionItemKind.Variable, insertText: 'env', range, documentation: 'Environment variables' },
            { label: 'vars', kind: monacoInstance.languages.CompletionItemKind.Variable, insertText: 'vars', range, documentation: 'Configuration variables' },
            { label: 'secrets', kind: monacoInstance.languages.CompletionItemKind.Variable, insertText: 'secrets', range, documentation: 'Secrets' },
            { label: 'inputs', kind: monacoInstance.languages.CompletionItemKind.Variable, insertText: 'inputs', range, documentation: 'Workflow inputs' },
            { label: 'needs', kind: monacoInstance.languages.CompletionItemKind.Variable, insertText: 'needs', range, documentation: 'Job dependencies' },
            { label: 'runner', kind: monacoInstance.languages.CompletionItemKind.Variable, insertText: 'runner', range, documentation: 'Runner context' },
            { label: 'matrix', kind: monacoInstance.languages.CompletionItemKind.Variable, insertText: 'matrix', range, documentation: 'Matrix context' },
            { label: 'strategy', kind: monacoInstance.languages.CompletionItemKind.Variable, insertText: 'strategy', range, documentation: 'Strategy context' }
          )

          // Functions
          suggestions.push(
            { label: 'contains', kind: monacoInstance.languages.CompletionItemKind.Function, insertText: 'contains($1, $2)', insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, documentation: 'Check if string contains substring' },
            { label: 'startsWith', kind: monacoInstance.languages.CompletionItemKind.Function, insertText: 'startsWith($1, $2)', insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, documentation: 'Check if string starts with prefix' },
            { label: 'endsWith', kind: monacoInstance.languages.CompletionItemKind.Function, insertText: 'endsWith($1, $2)', insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, documentation: 'Check if string ends with suffix' },
            { label: 'format', kind: monacoInstance.languages.CompletionItemKind.Function, insertText: 'format($1)', insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, documentation: 'Format string with arguments' },
            { label: 'join', kind: monacoInstance.languages.CompletionItemKind.Function, insertText: 'join($1, $2)', insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, documentation: 'Join array elements with delimiter' },
            { label: 'toJSON', kind: monacoInstance.languages.CompletionItemKind.Function, insertText: 'toJSON($1)', insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, documentation: 'Convert to JSON string' },
            { label: 'fromJSON', kind: monacoInstance.languages.CompletionItemKind.Function, insertText: 'fromJSON($1)', insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, documentation: 'Parse JSON string' },
            { label: 'hashFiles', kind: monacoInstance.languages.CompletionItemKind.Function, insertText: 'hashFiles($1)', insertTextRules: monacoInstance.languages.CompletionItemInsertTextRule.InsertAsSnippet, range, documentation: 'Hash files (not available in evaluator)' },
            { label: 'success', kind: monacoInstance.languages.CompletionItemKind.Function, insertText: 'success()', range, documentation: 'Check if all previous steps succeeded' },
            { label: 'failure', kind: monacoInstance.languages.CompletionItemKind.Function, insertText: 'failure()', range, documentation: 'Check if any previous step failed' },
            { label: 'cancelled', kind: monacoInstance.languages.CompletionItemKind.Function, insertText: 'cancelled()', range, documentation: 'Check if workflow was cancelled' },
            { label: 'always', kind: monacoInstance.languages.CompletionItemKind.Function, insertText: 'always()', range, documentation: 'Always returns true' }
          )
        }

        return { suggestions }
      },
    })

    // Register hover provider for documentation
    monacoInstance.languages.registerHoverProvider('github-expression', {
      provideHover: (model, position) => {
        const word = model.getWordAtPosition(position)
        if (!word) return null

        const docs: Record<string, string> = {
          // Functions
          'contains': '**contains(search, item)**\n\nReturns `true` if `search` contains `item`. If `search` is an array, returns `true` if the `item` is an element in the array. If `search` is a string, returns `true` if the `item` is a substring of `search`.',
          'startsWith': '**startsWith(searchString, searchValue)**\n\nReturns `true` when `searchString` starts with `searchValue`.',
          'endsWith': '**endsWith(searchString, searchValue)**\n\nReturns `true` if `searchString` ends with `searchValue`.',
          'format': '**format(string, ...replaceValue)**\n\nReplaces values in the `string`, with variables in `replaceValue`. Variables in the string are specified using the `{N}` syntax, where `N` is an integer.',
          'join': '**join(array, separator)**\n\nConcatenates the values in `array` using the `separator` as delimiter. Returns a string.',
          'toJSON': '**toJSON(value)**\n\nReturns a pretty-print JSON representation of `value`. You can use this function to debug the information provided in contexts.',
          'fromJSON': '**fromJSON(value)**\n\nReturns a JSON object or JSON data type for `value`. You can use this function to provide a JSON object as an evaluated expression or to convert environment variables from a string.',
          'hashFiles': '**hashFiles(path, ...path)**\n\nReturns a single hash for the set of files that matches the `path` pattern. Note: This function is not available in the playground evaluator.',

          // Contexts
          'github': '**github context**\n\nInformation about the workflow run and the event that triggered the run. Contains properties like `ref`, `sha`, `repository`, `event_name`, etc.',
          'env': '**env context**\n\nContains environment variables set in a workflow, job, or step.',
          'vars': '**vars context**\n\nContains configuration variables set at the repository, organization, or environment levels.',
          'secrets': '**secrets context**\n\nContains the names and values of secrets that are available to a workflow run.',
          'matrix': '**matrix context**\n\nContains the matrix properties defined in the workflow that apply to the current job.',
          'needs': '**needs context**\n\nContains outputs from all jobs that are defined as a direct dependency of the current job.',
          'runner': '**runner context**\n\nInformation about the runner that is executing the current job. Contains properties like `os`, `arch`, `temp`, etc.',
          'inputs': '**inputs context**\n\nContains input properties passed to a reusable workflow or manually triggered workflow.',
          'strategy': '**strategy context**\n\nInformation about the matrix execution strategy for the current job.',
          'job': '**job context**\n\nInformation about the currently running job.',
          'steps': '**steps context**\n\nInformation about the steps that have been run in the current job.',
        }

        const documentation = docs[word.word]
        if (documentation) {
          return {
            range: new monacoInstance.Range(
              position.lineNumber,
              word.startColumn,
              position.lineNumber,
              word.endColumn
            ),
            contents: [{ value: documentation }]
          }
        }

        return null
      }
    })
  }

  return (
    <>
      {showCopyNotification && (
        <div className="editor-copy-notification">
          ✓ Copied
        </div>
      )}
      <div className="expression-input-container">
        <div className="expression-input-section">
        <div className="expression-header">
          <label htmlFor="expression-input" className="section-label">
            Expression
          </label>
          <div className="example-dropdown-wrapper">
            <BeakerIcon className="dropdown-icon" />
            <select
              className="example-dropdown"
              onChange={(e) => handleExampleSelect(e.target.value)}
              value=""
            >
              <option value="">Load Example...</option>
            {Object.entries(groupedExamples).map(([category, examples]) => (
              <optgroup key={category} label={category}>
                {examples.map((example, index) => (
                  <option key={index} value={example.expression}>
                    {example.title}
                  </option>
                ))}
              </optgroup>
            ))}
            </select>
          </div>
        </div>
        <div className="expression-monaco">
          <button
            onClick={handleCopy}
            className="editor-copy-button"
            title="Copy result to clipboard"
          >
            <ClipboardDocumentListIcon className="icon" />
          </button>
          <MonacoEditor
            height="40px"
            language="github-expression"
            value={expression}
            onChange={(value) => value !== undefined && setExpression(value)}
            onMount={handleEditorDidMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'off',
              folding: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 0,
              glyphMargin: false,
              scrollBeyondLastLine: false,
              wordWrap: 'off',
              wrappingIndent: 'none',
              automaticLayout: true,
              scrollbar: {
                vertical: 'hidden',
                horizontal: 'auto',
              },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
              renderLineHighlight: 'none',
              contextmenu: false,
              suggest: {
                showKeywords: true,
                showSnippets: true,
              },
            }}
          />
        </div>
      </div>

      <div className="expression-result-section">
        <div className="section-header">
          <span className="section-label">Result</span>
        </div>

        {isEvaluating ? (
          <div className="result-loading">Evaluating...</div>
        ) : result ? (
          <div className={`result-content ${!result.error ? 'success' : 'error'}`}>
            {!result.error ? (
              <>
                <div className="result-metadata">
                  <span className="result-type">
                    Type: <strong>{getValueType(result.value)}</strong>
                  </span>
                  <span className="result-status success">✓ Success</span>
                </div>
                <div className="result-value-wrapper">
                  <div className="result-value">
                    <pre>{formatValue(result.value)}</pre>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="result-metadata">
                  <span className="result-status error">✗ Error</span>
                </div>
                <div className="result-error">
                  {result.error}
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>

      {/* Example chips */}
      <div className="example-chips">
        <span className="chips-label">Examples:</span>
        <div className="chips-container">
          {EXAMPLES.map((example, index) => (
            <button
              key={index}
              className="example-chip"
              onClick={() => setExpression(example.expression)}
              title={example.expression}
            >
              {example.title}
            </button>
          ))}
        </div>
      </div>
    </div>
    </>
  )
}
