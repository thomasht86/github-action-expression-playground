import React, { useRef } from 'react'
import * as monaco from 'monaco-editor'
import { Editor as MonacoEditor } from '@monaco-editor/react'

interface EditorProps {
  value: string
  onChange: (value: string) => void
  onValidationErrors?: (errors: any[]) => void
}

export const Editor: React.FC<EditorProps> = ({ value, onChange, onValidationErrors }) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor

    // Configure YAML language
    monaco.languages.setLanguageConfiguration('yaml', {
      brackets: [['[', ']'], ['(', ')'], ['{', '}']],
      autoClosingPairs: [
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '{', close: '}' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ],
      surroundingPairs: [
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '{', close: '}' },
        { open: '"', close: '"' },
        { open: "'", close: "'" }
      ]
    })

    // Listen for validation errors
    const model = editor.getModel()
    if (model && onValidationErrors) {
      const listener = monaco.editor.onDidChangeMarkers(() => {
        const markers = monaco.editor.getModelMarkers({ resource: model.uri })
        onValidationErrors(markers)
      })
      return () => listener.dispose()
    }
  }

  const handleChange = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      onChange(newValue)
    }
  }

  return (
    <div className="monaco-editor-container">
      <MonacoEditor
        height="100%"
        language="yaml"
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          automaticLayout: true,
          scrollBeyondLastLine: false,
          renderWhitespace: 'selection',
          folding: true,
          lineNumbers: 'on',
          glyphMargin: true,
        }}
      />
    </div>
  )
}