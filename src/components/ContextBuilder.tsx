import React, { useState } from 'react'
import { Editor as MonacoEditor } from '@monaco-editor/react'
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
  const [yamlValue, setYamlValue] = useState<string>(() => {
    try {
      return stringifyYaml(matrix)
    } catch {
      return 'os: ubuntu-latest\nnode: "18"\ninclude:\n  - os: ubuntu-latest\n    node: "16"\n  - os: windows-latest\n    node: "18"'
    }
  })

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

        {filteredVars.map((variable, index) => (
          <div key={index} className="variable-row">
            <input
              type="text"
              placeholder="Name"
              value={variable.name}
              onChange={(e) => updateVariable(
                variables.indexOf(variable),
                'name',
                e.target.value
              )}
            />
            <input
              type={type === 'secrets' ? 'password' : 'text'}
              placeholder="Value"
              value={variable.value}
              onChange={(e) => updateVariable(
                variables.indexOf(variable),
                'value',
                e.target.value
              )}
            />
            <span className="scope-indicator">{variable.scope}</span>
            <button
              className="remove-btn"
              onClick={() => removeVariable(variables.indexOf(variable))}
            >
              ×
            </button>
          </div>
        ))}
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