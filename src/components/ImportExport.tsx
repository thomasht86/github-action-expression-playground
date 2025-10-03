import React, { useRef } from 'react'
import { ContextVariable, GitHubContext } from '../types'

interface PlaygroundState {
  workflow: string
  variables: ContextVariable[]
  github: Partial<GitHubContext>
}

interface ImportExportProps {
  workflowYaml: string
  variables: ContextVariable[]
  github: Partial<GitHubContext>
  onImport: (state: PlaygroundState) => void
  onWorkflowChange: (workflow: string) => void
}

export const ImportExport: React.FC<ImportExportProps> = ({
  workflowYaml,
  variables,
  github,
  onImport,
  onWorkflowChange
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const exportState = () => {
    const state: PlaygroundState = {
      workflow: workflowYaml,
      variables: variables.filter(v => v.type !== 'secrets'), // Exclude secrets
      github
    }

    const dataStr = JSON.stringify(state, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'github-actions-playground.json'
    link.click()

    URL.revokeObjectURL(url)
  }

  const importState = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target?.result as string) as PlaygroundState
        onImport(state)
      } catch (error) {
        alert('Invalid file format')
      }
    }
    reader.readAsText(file)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const importWorkflow = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      onWorkflowChange(content)
    }
    reader.readAsText(file)

    // Reset file input
    event.target.value = ''
  }

  const copyShareLink = () => {
    const state: PlaygroundState = {
      workflow: workflowYaml,
      variables: variables.filter(v => v.type !== 'secrets'), // Exclude secrets
      github
    }

    const encodedState = btoa(JSON.stringify(state))
    const shareUrl = `${window.location.origin}${window.location.pathname}#${encodedState}`

    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Share link copied to clipboard!')
    }).catch(() => {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = shareUrl
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      alert('Share link copied to clipboard!')
    })
  }

  return (
    <div className="import-export">
      <div className="import-export-buttons">
        <button onClick={exportState} className="export-btn">
          📥 Export State
        </button>

        <button onClick={() => fileInputRef.current?.click()} className="import-btn">
          📤 Import State
        </button>

        <button onClick={() => document.getElementById('workflow-import')?.click()} className="import-workflow-btn">
          📄 Import Workflow
        </button>

        <button onClick={copyShareLink} className="share-btn">
          🔗 Copy Share Link
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={importState}
        style={{ display: 'none' }}
      />

      <input
        id="workflow-import"
        type="file"
        accept=".yml,.yaml"
        onChange={importWorkflow}
        style={{ display: 'none' }}
      />
    </div>
  )
}