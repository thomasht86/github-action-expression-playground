import { useState, useEffect } from 'react'
import { ExpressionResult } from '../types'

interface ExpressionInputProps {
  onEvaluate: (expression: string) => Promise<ExpressionResult>
  initialExpression?: string
}

export function ExpressionInput({ onEvaluate, initialExpression }: ExpressionInputProps) {
  const [expression, setExpression] = useState(initialExpression || "github.ref == 'refs/heads/main'")
  const [result, setResult] = useState<ExpressionResult | null>(null)
  const [isEvaluating, setIsEvaluating] = useState(false)

  // Update expression when initialExpression changes
  useEffect(() => {
    if (initialExpression) {
      setExpression(initialExpression)
    }
  }, [initialExpression])

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

  return (
    <div className="expression-input-container">
      <div className="expression-input-section">
        <label htmlFor="expression-input" className="section-label">
          Expression
        </label>
        <textarea
          id="expression-input"
          className="expression-textarea"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Enter a GitHub Actions expression..."
          rows={3}
        />
      </div>

      <div className="expression-result-section">
        <div className="section-header">
          <span className="section-label">Result</span>
          {result && !result.error && (
            <button
              onClick={handleCopy}
              className="copy-button"
              title="Copy result to clipboard"
            >
              📋 Copy
            </button>
          )}
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
                <div className="result-value">
                  <pre>{formatValue(result.value)}</pre>
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
  )
}
