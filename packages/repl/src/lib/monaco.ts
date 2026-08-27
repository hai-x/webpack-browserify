import { loader, type Monaco } from '@monaco-editor/react'
import * as monaco from 'monaco-editor/editor'
import 'monaco-editor/features/register.all'
import 'monaco-editor/languages/definitions/css/register'
import 'monaco-editor/languages/definitions/html/register'
import 'monaco-editor/languages/definitions/javascript/register'
import 'monaco-editor/languages/definitions/markdown/register'
import 'monaco-editor/languages/definitions/typescript/register'
import 'monaco-editor/languages/features/css/register'
import 'monaco-editor/languages/features/html/register'
import 'monaco-editor/languages/features/json/register'
import * as typescript from 'monaco-editor/languages/features/typescript/register'

self.MonacoEnvironment = {
  getWorker(_id: string, label: string) {
    switch (label) {
      case 'json':
        return new Worker(
          new URL(
            'monaco-editor/languages/features/json/json.worker.js',
            import.meta.url
          )
        )
      case 'css':
      case 'scss':
      case 'less':
        return new Worker(
          new URL(
            'monaco-editor/languages/features/css/css.worker.js',
            import.meta.url
          )
        )
      case 'html':
        return new Worker(
          new URL(
            'monaco-editor/languages/features/html/html.worker.js',
            import.meta.url
          )
        )
      case 'typescript':
      case 'javascript':
        return new Worker(
          new URL(
            'monaco-editor/languages/features/typescript/ts.worker.js',
            import.meta.url
          )
        )
      default:
        return new Worker(
          new URL('monaco-editor/editor/editor.worker.js', import.meta.url)
        )
    }
  }
}

// playground files import each other by path; skip semantic checks
for (const defaults of [
  typescript.javascriptDefaults,
  typescript.typescriptDefaults
]) {
  defaults.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: false
  })
  defaults.setCompilerOptions({
    target: typescript.ScriptTarget.ESNext,
    module: typescript.ModuleKind.ESNext,
    allowJs: true,
    allowNonTsExtensions: true
  })
}

monaco.editor.defineTheme('playground-dark', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '6b7280', fontStyle: 'italic' },
    { token: 'keyword', foreground: 'c084fc' },
    { token: 'string', foreground: '86efac' },
    { token: 'number', foreground: 'fbbf24' },
    { token: 'type.identifier', foreground: '7dd3fc' }
  ],
  colors: {
    'editor.background': '#0c0f14',
    'editor.foreground': '#e2e6ee',
    'editorGutter.background': '#0c0f14',
    'editorLineNumber.foreground': '#3f4756',
    'editorLineNumber.activeForeground': '#9aa4b5',
    'editor.lineHighlightBackground': '#12161d',
    'editor.lineHighlightBorder': '#00000000',
    'editor.selectionBackground': '#264f7866',
    'editorIndentGuide.background1': '#1c222c',
    'editorIndentGuide.activeBackground1': '#2c3442',
    'editorWidget.background': '#12161d',
    'editorWidget.border': '#232a36',
    'editorSuggestWidget.background': '#12161d',
    'editorSuggestWidget.border': '#232a36',
    'editorHoverWidget.background': '#12161d',
    'editorHoverWidget.border': '#232a36',
    'scrollbarSlider.background': '#ffffff14',
    'scrollbarSlider.hoverBackground': '#ffffff22',
    'scrollbarSlider.activeBackground': '#ffffff33',
    'scrollbar.shadow': '#00000000',
    focusBorder: '#00000000'
  }
})

monaco.editor.defineTheme('playground-light', {
  base: 'vs',
  inherit: true,
  rules: [
    { token: 'comment', foreground: '9ca3af', fontStyle: 'italic' },
    { token: 'keyword', foreground: '7c3aed' },
    { token: 'string', foreground: '15803d' },
    { token: 'number', foreground: 'b45309' },
    { token: 'type.identifier', foreground: '0369a1' }
  ],
  colors: {
    'editor.background': '#ffffff',
    'editorGutter.background': '#ffffff',
    'editorLineNumber.foreground': '#c0c6d1',
    'editorLineNumber.activeForeground': '#6b7280',
    'editor.lineHighlightBackground': '#f5f7fa',
    'editor.lineHighlightBorder': '#00000000',
    'editorIndentGuide.background1': '#eceff3',
    'editorIndentGuide.activeBackground1': '#d5dbe3',
    'scrollbarSlider.background': '#00000014',
    'scrollbarSlider.hoverBackground': '#00000022',
    'scrollbarSlider.activeBackground': '#00000033',
    'scrollbar.shadow': '#00000000',
    focusBorder: '#00000000'
  }
})

loader.config({ monaco: monaco as unknown as Monaco })

export const languageOf = (path: string) => {
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase()
  switch (ext) {
    case 'js':
    case 'mjs':
    case 'cjs':
    case 'jsx':
      return 'javascript'
    case 'ts':
    case 'mts':
    case 'cts':
    case 'tsx':
      return 'typescript'
    case 'json':
      return 'json'
    case 'css':
      return 'css'
    case 'html':
    case 'htm':
      return 'html'
    case 'md':
      return 'markdown'
    default:
      return 'plaintext'
  }
}

export const modelUri = (path: string) => `file://${path}`

export const disposeModel = (path: string) => {
  monaco.editor.getModel(monaco.Uri.parse(modelUri(path)))?.dispose()
}
