import Editor, { OnMount } from '@monaco-editor/react'
import { FC } from 'react'
import { useTheme } from '@/components/theme-provider'
import { languageOf, modelUri } from '@/lib/monaco'

type Props = {
  path?: string
  language?: string
  value: string
  readOnly?: boolean
  onChange?: (value: string) => void
  onMount?: OnMount
}

export const CodeEditor: FC<Props> = ({
  path,
  language,
  value,
  readOnly,
  onChange,
  onMount
}) => {
  const { resolvedTheme } = useTheme()
  return (
    <Editor
      path={path ? modelUri(path) : undefined}
      language={language ?? (path ? languageOf(path) : 'plaintext')}
      value={value}
      theme={resolvedTheme === 'dark' ? 'playground-dark' : 'playground-light'}
      onChange={(v) => onChange?.(v ?? '')}
      onMount={onMount}
      loading={
        <div className="text-xs text-muted-foreground">Loading editor…</div>
      }
      options={{
        readOnly,
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 13,
        lineHeight: 21,
        fontFamily:
          'ui-monospace, "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace',
        fontLigatures: true,
        lineNumbersMinChars: 3,
        glyphMargin: false,
        folding: true,
        scrollBeyondLastLine: false,
        renderLineHighlight: 'line',
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        tabSize: 2,
        padding: { top: 12, bottom: 12 },
        overviewRulerBorder: false,
        hideCursorInOverviewRuler: true,
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        guides: { indentation: true },
        bracketPairColorization: { enabled: true },
        domReadOnly: readOnly,
        contextmenu: !readOnly
      }}
    />
  )
}
