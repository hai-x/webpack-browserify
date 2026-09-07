import { ChevronRight } from 'lucide-react'
import { FC, Fragment } from 'react'
import { CodeEditor } from '@/components/code-editor'
import { languageOf } from '@/lib/monaco'
import { formatBytes } from '@/lib/utils'
import { useStore } from '@/store'

export const EditorPane: FC = () => {
  const activeFile = useStore((s) => s.activeFile)
  const files = useStore((s) => s.files)
  const config = useStore((s) => s.config)
  const configPath = useStore((s) => s.configPath)
  const setFile = useStore((s) => s.setFile)
  const setConfig = useStore((s) => s.setConfig)

  const isConfig = activeFile === configPath
  const value = isConfig ? config : (files[activeFile] ?? '')
  const segments = activeFile.split('/').filter(Boolean)

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center justify-between border-b bg-surface px-3 text-xs">
        <div className="flex items-center gap-1 font-mono text-muted-foreground">
          {segments.map((seg, i) => (
            <Fragment key={`${i}-${seg}`}>
              {i > 0 && <ChevronRight className="h-3 w-3 opacity-50" />}
              <span
                className={
                  i === segments.length - 1 ? 'text-foreground' : undefined
                }
              >
                {seg}
              </span>
            </Fragment>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground">
            {formatBytes(new TextEncoder().encode(value).length)}
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {languageOf(activeFile)}
          </span>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <CodeEditor
          path={activeFile}
          value={value}
          onChange={(v) => (isConfig ? setConfig(v) : setFile(activeFile, v))}
          onMount={(editor, monaco) => {
            editor.addCommand(
              monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
              () => useStore.getState().build()
            )
          }}
        />
      </div>
    </div>
  )
}
