import React, { useState } from 'react'
import { ContextVariable, GitHubContext } from '../types'

interface ContextBuilderProps {
  variables: ContextVariable[]
  onVariablesChange: (variables: ContextVariable[]) => void
  github: Partial<GitHubContext>
  onGitHubChange: (github: Partial<GitHubContext>) => void
}

type TabType = 'env' | 'vars' | 'secrets' | 'inputs' | 'github' | 'matrix' | 'needs'

export const ContextBuilder: React.FC<ContextBuilderProps> = ({
  variables,
  onVariablesChange,
  github,
  onGitHubChange
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('env')
  const [currentScope, setCurrentScope] = useState<'workflow' | 'job' | 'step'>('workflow')

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

  const renderGitHubContext = () => {
    return (
      <div className="github-context">
        <div className="context-field">
          <label>Repository:</label>
          <input
            type="text"
            placeholder="owner/repo"
            value={github.repository || ''}
            onChange={(e) => onGitHubChange({ ...github, repository: e.target.value })}
          />
        </div>
        <div className="context-field">
          <label>Ref:</label>
          <input
            type="text"
            placeholder="refs/heads/main"
            value={github.ref || ''}
            onChange={(e) => onGitHubChange({ ...github, ref: e.target.value })}
          />
        </div>
        <div className="context-field">
          <label>SHA:</label>
          <input
            type="text"
            placeholder="commit sha"
            value={github.sha || ''}
            onChange={(e) => onGitHubChange({ ...github, sha: e.target.value })}
          />
        </div>
        <div className="context-field">
          <label>Event Payload (JSON):</label>
          <textarea
            placeholder='{"ref": "refs/heads/main"}'
            value={JSON.stringify(github.event || {}, null, 2)}
            onChange={(e) => {
              try {
                const event = JSON.parse(e.target.value)
                onGitHubChange({ ...github, event })
              } catch {
                // Invalid JSON, ignore
              }
            }}
            rows={6}
          />
        </div>
      </div>
    )
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: 'env', label: 'Environment' },
    { key: 'vars', label: 'Variables' },
    { key: 'secrets', label: 'Secrets' },
    { key: 'inputs', label: 'Inputs' },
    { key: 'github', label: 'GitHub' },
    { key: 'matrix', label: 'Matrix' },
    { key: 'needs', label: 'Needs' }
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
        {activeTab === 'github' && renderGitHubContext()}
        {(activeTab === 'env' || activeTab === 'vars' || activeTab === 'secrets' || activeTab === 'inputs') &&
          renderVariableTable(activeTab)}
        {(activeTab === 'matrix' || activeTab === 'needs') && (
          <div className="coming-soon">
            {activeTab} context builder coming soon...
          </div>
        )}
      </div>
    </div>
  )
}