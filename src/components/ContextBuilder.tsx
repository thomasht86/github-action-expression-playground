import React, { useState } from 'react'
import { Editor as MonacoEditor } from '@monaco-editor/react'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { ContextVariable } from '../types'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'

interface ContextBuilderProps {
  variables: ContextVariable[]
  onVariablesChange: (variables: ContextVariable[]) => void
  matrix?: Record<string, any>
  onMatrixChange?: (matrix: Record<string, any>) => void
}

type TabType = 'env' | 'vars' | 'secrets' | 'inputs' | 'matrix'

export const ContextBuilder: React.FC<ContextBuilderProps> = ({
  variables,
  onVariablesChange,
  matrix = {},
  onMatrixChange
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('env')
  const [currentScope, setCurrentScope] = useState<'workflow' | 'job' | 'step'>('workflow')
  const [yamlError, setYamlError] = useState<string | null>(null)
  const [revealedSecrets, setRevealedSecrets] = useState<Set<number>>(new Set())
  const [yamlValue, setYamlValue] = useState<string>(() => {
    try {
      return stringifyYaml(matrix)
    } catch {
      return 'os: ubuntu-latest\nnode: "18"\ninclude:\n  - os: ubuntu-latest\n    node: "16"\n  - os: windows-latest\n    node: "18"'
    }
  })

  const toggleSecretVisibility = (index: number) => {
    setRevealedSecrets(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const addVariable = (type: 'env' | 'vars' | 'secrets' | 'inputs') => {
    const newVar: ContextVariable = {
      name: '',
      value: '',
      type,
      scope: currentScope
    }
    onVariablesChange([...variables, newVar])
  }

  const updateVariable = (index: number, field: keyof ContextVariable, value: string) => {
    const updated = [...variables]
    updated[index] = { ...updated[index], [field]: value }
    onVariablesChange(updated)
  }

  const removeVariable = (index: number) => {
    onVariablesChange(variables.filter((_, i) => i !== index))
  }


  const renderVariableTable = (type: 'env' | 'vars' | 'secrets' | 'inputs') => {
    const filteredVars = variables.filter(v => v.type === type)

    return (
      <div className="variable-table">
        <div className="table-header">
          <div className="scope-switcher">
            <label>Scope: </label>
            <select
              value={currentScope}
              onChange={(e) => setCurrentScope(e.target.value as 'workflow' | 'job' | 'step')}
            >
              <option value="workflow">Workflow</option>
              <option value="job">Job</option>
              <option value="step">Step</option>
            </select>
          </div>
          <button
            className="add-variable-btn"
            onClick={() => addVariable(type)}
          >
            + Add {type}
          </button>
        </div>

        {filteredVars.map((variable, index) => {
          const globalIndex = variables.indexOf(variable)
          const isSecret = type === 'secrets'
          const isRevealed = revealedSecrets.has(globalIndex)

          return (
            <div key={index} className="variable-row">
              <input
                type="text"
                placeholder="Name"
                value={variable.name}
                onChange={(e) => updateVariable(
                  globalIndex,
                  'name',
                  e.target.value
                )}
              />
              <div className="variable-value-container">
                <input
                  type={isSecret && !isRevealed ? 'password' : 'text'}
                  placeholder="Value"
                  value={variable.value}
                  onChange={(e) => updateVariable(
                    globalIndex,
                    'value',
                    e.target.value
                  )}
                  className="variable-value-input"
                />
                {isSecret && (
                  <button
                    className="reveal-secret-btn"
                    onClick={() => toggleSecretVisibility(globalIndex)}
                    title={isRevealed ? 'Hide secret' : 'Reveal secret'}
                  >
                    {isRevealed ? (
                      <EyeSlashIcon className="icon" />
                    ) : (
                      <EyeIcon className="icon" />
                    )}
                  </button>
                )}
              </div>
              <span className="scope-indicator">{variable.scope}</span>
              <button
                className="remove-btn"
                onClick={() => removeVariable(globalIndex)}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    )
  }

  const handleMatrixYamlChange = (value: string | undefined) => {
    if (!value) return
    setYamlValue(value)

    try {
      const parsed = parseYaml(value) as Record<string, any>
      setYamlError(null)
      onMatrixChange?.(parsed || {})
    } catch (error) {
      setYamlError(error instanceof Error ? error.message : 'Invalid YAML')
    }
  }

  const renderMatrixEditor = () => {
    return (
      <div className="matrix-editor">
        <div className="matrix-monaco-wrapper">
          <MonacoEditor
            height="400px"
            language="yaml"
            value={yamlValue}
            onChange={handleMatrixYamlChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              lineNumbers: 'on',
              folding: true,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              wrappingIndent: 'indent',
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
            }}
          />
        </div>
        {yamlError && <div className="matrix-error">{yamlError}</div>}
      </div>
    )
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'env', label: 'Environment' },
    { key: 'vars', label: 'Variables' },
    { key: 'secrets', label: 'Secrets' },
    { key: 'inputs', label: 'Inputs' },
    { key: 'matrix', label: 'Matrix' }
  ]

  return (
    <div className="context-builder">
      <div className="panel-header">Context & Variables</div>

      <div className="tab-bar">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {activeTab === 'matrix' ? renderMatrixEditor() : renderVariableTable(activeTab as 'env' | 'vars' | 'secrets' | 'inputs')}
      </div>
    </div>
  )
}