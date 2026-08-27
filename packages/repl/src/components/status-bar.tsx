import { FC } from 'react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

const isMac = /Mac|iPhone|iPad/.test(navigator.platform)

export const StatusBar: FC = () => {
  const status = useStore((s) => s.status)
  const duration = useStore((s) => s.duration)
  const version = useStore((s) => s.version)
  const files = useStore((s) => s.files)
  const output = useStore((s) => s.output)
  const autoBuild = useStore((s) => s.autoBuild)

  const label =
    status === 'building'
      ? 'Building…'
      : status === 'success'
        ? `Compiled in ${duration} ms`
        : status === 'error'
          ? 'Build failed'
          : 'Ready'

  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t bg-surface px-3 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            status === 'success' && 'bg-success',
            status === 'error' && 'bg-danger',
            status === 'building' && 'animate-pulse bg-warning',
            status === 'idle' && 'bg-muted-foreground'
          )}
        />
        {label}
      </span>
      <span className="font-mono">webpack {version ? `v${version}` : ''}</span>
      <span className="ml-auto">
        {Object.keys(files).length} files · {Object.keys(output).length} emitted
      </span>
      <span>Auto build {autoBuild ? 'on' : 'off'}</span>
      <span className="hidden font-mono sm:inline">
        {isMac ? '⌘' : 'Ctrl'}↵ build
      </span>
    </footer>
  )
}
