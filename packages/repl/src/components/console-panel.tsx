import { AlertTriangle, CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { FC } from 'react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

export const ConsolePanel: FC = () => {
  const diagnostics = useStore((s) => s.diagnostics)
  const status = useStore((s) => s.status)
  const duration = useStore((s) => s.duration)

  const errors = diagnostics.filter((d) => d.level === 'error').length
  const warnings = diagnostics.length - errors

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-3 border-b bg-surface px-3 text-xs">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Problems
        </span>
        {errors > 0 && (
          <span className="flex items-center gap-1 text-danger">
            <XCircle className="h-3 w-3" /> {errors}
          </span>
        )}
        {warnings > 0 && (
          <span className="flex items-center gap-1 text-warning">
            <AlertTriangle className="h-3 w-3" /> {warnings}
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-2 font-mono text-xs">
        {status === 'building' && (
          <div className="flex items-center gap-2 px-2 py-1 text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Building…
          </div>
        )}
        {status === 'success' && diagnostics.length === 0 && (
          <div className="flex items-center gap-2 px-2 py-1 text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Compiled successfully in {duration} ms
          </div>
        )}
        {status === 'success' && diagnostics.length > 0 && (
          <div className="flex items-center gap-2 px-2 py-1 text-warning">
            <AlertTriangle className="h-3.5 w-3.5" />
            Compiled with {warnings} warning{warnings === 1 ? '' : 's'} in{' '}
            {duration} ms
          </div>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-2 px-2 py-1 text-danger">
            <XCircle className="h-3.5 w-3.5" />
            Build failed with {errors} error{errors === 1 ? '' : 's'}
            {duration !== null && ` in ${duration} ms`}
          </div>
        )}
        {status === 'idle' && (
          <div className="px-2 py-1 text-muted-foreground">Ready.</div>
        )}
        {diagnostics.map((d, i) => (
          <div
            key={`${i}-${d.message}`}
            className={cn(
              'my-1 rounded-md border-l-2 px-3 py-2 whitespace-pre-wrap break-words',
              d.level === 'error'
                ? 'border-danger bg-danger/5 text-danger'
                : 'border-warning bg-warning/5 text-warning'
            )}
          >
            {d.module && (
              <div className="mb-1 text-[10px] uppercase tracking-wide opacity-70">
                {d.module}
              </div>
            )}
            {d.message}
            {d.details && (
              <details className="mt-1 text-[10px] opacity-70">
                <summary className="cursor-pointer select-none">
                  details
                </summary>
                <pre className="mt-1 overflow-x-auto whitespace-pre-wrap">
                  {d.details}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
