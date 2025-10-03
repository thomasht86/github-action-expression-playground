import React, { useState } from 'react'
import { ExpressionResult, ValidationError } from '../types'
import { ExpressionExamples } from './ExpressionExamples'

interface ResultsPanelProps {
  validationErrors: ValidationError[]
  onEvaluateExpression: (expression: string) => Promise<ExpressionResult>
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  validationErrors,
  onEvaluateExpression
}) => {
  const [expression, setExpression] = useState('')
  const [result, setResult] = useState<ExpressionResult | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  const handleEvaluate = async () => {
    if (!expression.trim()) return

    setIsEvaluating(true)
    try {
      const evalResult = await onEvaluateExpression(expression)
      setResult(evalResult)
    } catch (error) {
      setResult({
        value: null,
        type: 'error',
        contextHits: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleEvaluate()
    }
  }

  const handleSelectExample = async (exampleExpression: string) => {
    setExpression(exampleExpression)
    setIsEvaluating(true)
    try {
      const evalResult = await onEvaluateExpression(exampleExpression)
      setResult(evalResult)
    } catch (error) {
      setResult({
        value: null,
        type: 'error',
        contextHits: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsEvaluating(false)
    }
  }

  return (
    <div className="results-panel">
      <div className="panel-header">Results & Insights</div>

      <div className="expression-evaluator">
        <h3>Expression Evaluator</h3>
        <div className="evaluator-input">
          <input
            type="text"
            placeholder="Enter expression (e.g., github.ref == 'refs/heads/main')"
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <button
            onClick={handleEvaluate}
            disabled={isEvaluating || !expression.trim()}
            className="evaluate-btn"
          >
            {isEvaluating ? 'Evaluating...' : 'Evaluate'}
          </button>
        </div>
        <div className="keyboard-hint">
          Press Ctrl+Enter (Cmd+Enter on Mac) to evaluate
        </div>

        {result && (
          <div className="evaluation-result">
            <div className="result-section">
              <h4>Result</h4>
              <div className="result-value">
                <strong>Value:</strong> {JSON.stringify(result.value)}
              </div>
              <div className="result-type">
                <strong>Type:</strong> {result.type}
              </div>
              {result.error && (
                <div className="result-error">
                  <strong>Error:</strong> {result.error}
                </div>
              )}
            </div>

            {result.contextHits.length > 0 && (
              <div className="context-hits">
                <h4>Context Hits</h4>
                <ul>
                  {result.contextHits.map((hit, index) => (
                    <li key={index}>{hit}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {validationErrors.length > 0 && (
        <>
          {/* Schema and syntax errors */}
          {validationErrors.filter(error => error.severity === 'error' || !error.message.includes('context')).length > 0 && (
            <div className="validation-errors">
              <h3>Validation Issues</h3>
              {validationErrors
                .filter(error => error.severity === 'error' || !error.message.includes('context'))
                .map((error, index) => (
                  <div key={index} className={`error-item ${error.severity}`}>
                    <div className="error-header">
                      <span className="severity">{error.severity.toUpperCase()}</span>
                      <span className="location">Line {error.line}, Column {error.column}</span>
                      <span className="source">[{error.source}]</span>
                    </div>
                    <div className="error-message">{error.message}</div>
                  </div>
                ))}
            </div>
          )}

          {/* Context guidelines */}
          {validationErrors.filter(error => error.message.includes('context')).length > 0 && (
            <div className="context-guidelines">
              <h3>Context Guidelines</h3>
              <div className="guidelines-note">
                ℹ️ These are GitHub Actions context availability rules. In this playground, all contexts are available for experimentation.
              </div>
              {validationErrors
                .filter(error => error.message.includes('context'))
                .map((error, index) => (
                  <div key={index} className="guideline-item">
                    <div className="guideline-message">{error.message}</div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      <ExpressionExamples onSelectExample={handleSelectExample} />
    </div>
  )
}