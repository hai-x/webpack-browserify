import { Hammer } from 'lucide-react'
import { FC } from 'react'
import { CodeEditor } from '@/components/code-editor'
import { languageOf } from '@/lib/monaco'
import { cn, formatBytes } from '@/lib/utils'
import { useStore } from '@/store'

export const OutputPane: FC = () => {
  const output = useStore((s) => s.output)
  const outputPath = useStore((s) => s.outputPath)
  const activeOutput = useStore((s) => s.activeOutput)
  const setActiveOutput = useStore((s) => s.setActiveOutput)
  const status = useStore((s) => s.status)

  const paths = Object.keys(output)
  const content = activeOutput ? output[activeOutput] : undefined
  const prefix = outputPath === '/' ? '/' : `${outputPath}/`

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-stretch border-b bg-surface text-xs">
        <div className="flex items-center px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Output
        </div>
        <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto">
          {paths.map((path) => {
            const active = path === activeOutput
            return (
              <button
                key={path}
                type="button"
                onClick={() => setActiveOutput(path)}
                className={cn(
                  'relative flex shrink-0 items-center gap-2 border-r px-3 font-mono transition-colors',
                  active
                    ? 'bg-background text-foreground'
                    : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                )}
              >
                {path.startsWith(prefix) ? path.slice(prefix.length) : path}
                <span className="text-[10px] opacity-60">
                  {formatBytes(new TextEncoder().encode(output[path]).length)}
                </span>
                {active && (
                  <span className="absolute inset-x-0 -bottom-px h-px bg-brand" />
                )}
              </button>
            )
          })}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {content !== undefined && activeOutput ? (
          <CodeEditor
            key={activeOutput}
            language={languageOf(activeOutput)}
            value={content}
            readOnly
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <Hammer className="h-6 w-6 opacity-40" />
            <span className="text-xs">
              {status === 'building'
                ? 'Building…'
                : status === 'error'
                  ? 'Build failed — see problems below'
                  : 'Run a build to see the emitted files'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
