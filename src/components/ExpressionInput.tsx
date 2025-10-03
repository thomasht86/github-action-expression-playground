import { useState, useEffect, useRef } from 'react'
import { Editor as MonacoEditor } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
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
  { category: 'Variables & Secrets', title: 'Environment Variable with Default', expression: "env.NODE_VERSION || '16'" },
  { category: 'Variables & Secrets', title: 'Secret Exists', expression: "secrets.NPM_TOKEN != ''" },
  { category: 'Variables & Secrets', title: 'Format with Variables', expression: "format('v{0}.{1}', vars.MAJOR, vars.MINOR)" },
  { category: 'String Functions', title: 'Contains Check', expression: "contains(github.repository, 'octocat')" },
  { category: 'String Functions', title: 'Starts With Branch', expression: "startsWith(github.ref, 'refs/heads/')" },
  { category: 'String Functions', title: 'Ends With', expression: "endsWith(github.ref, '/main')" },
  { category: 'JSON Functions', title: 'GitHub Context to JSON', expression: 'toJSON(github)' },
  { category: 'JSON Functions', title: 'Event Payload to JSON', expression: 'toJSON(github.event)' },
  { category: 'JSON Functions', title: 'Parse JSON String', expression: "fromJSON('{\"environment\": \"production\"}')" },
  { category: 'Status Functions', title: 'Success Check', expression: 'success()' },
  { category: 'Status Functions', title: 'Failure Check', expression: 'failure()' },
  { category: 'Status Functions', title: 'Always Run', expression: 'always()' },
  { category: 'Status Functions', title: 'Cancelled Check', expression: 'cancelled()' },
  { category: 'Complex Examples', title: 'Production Deploy', expression: "github.ref == 'refs/heads/main' && env.APP_ENV == 'production'" },
  { category: 'Complex Examples', title: 'Multiple Events', expression: "github.event_name == 'push' || github.event_name == 'workflow_dispatch'" },
  { category: 'Complex Examples', title: 'Conditional Message', expression: "format('Deploying {0} to {1}', github.sha, env.ENVIRONMENT || 'staging')" },
  { category: 'Complex Examples', title: 'Tag Version Build', expression: "format('tag-{0}', vars.BUILD)" }
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
          // Contexts
          [/\b(github|env|vars|secrets|inputs|needs|strategy|matrix|runner|job|steps)\b/, 'keyword'],

          // Functions
          [/\b(contains|startsWith|endsWith|format|join|toJSON|fromJSON|hashFiles|success|failure|cancelled|always)\b/, 'function'],

          // Operators
          [/==|!=|<|>|<=|>=/, 'operator'],
          [/&&|\|\||!/, 'operator'],

          // Strings
          [/'[^']*'/, 'string'],
          [/"[^"]*"/, 'string'],

          // Numbers
          [/\d+/, 'number'],

          // Properties
          [/\.\w+/, 'property'],
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
          <select
            className="example-dropdown"
            onChange={(e) => handleExampleSelect(e.target.value)}
            value=""
          >
            <option value="">📚 Load Example...</option>
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
    </div>
    </>
  )
}
