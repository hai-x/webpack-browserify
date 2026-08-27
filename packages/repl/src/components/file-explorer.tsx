import {
  Braces,
  FileCode2,
  FileJson2,
  FileText,
  Plus,
  Trash2
} from 'lucide-react'
import { FC, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

const FileIcon: FC<{ path: string; className?: string }> = ({
  path,
  className
}) => {
  if (path.endsWith('.json')) return <FileJson2 className={className} />
  if (/\.[cm]?[jt]sx?$/.test(path)) return <FileCode2 className={className} />
  return <FileText className={className} />
}

const splitPath = (path: string) => {
  const i = path.lastIndexOf('/')
  return { dir: path.slice(1, i + 1), name: path.slice(i + 1) }
}

const RenameInput: FC<{
  path: string
  onRename: (to: string) => boolean
  onCancel: () => void
}> = ({ path, onRename, onCancel }) => {
  const [draft, setDraft] = useState(path.slice(1))
  const [invalid, setInvalid] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // focus and select the base name
  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.focus()
    const dot = el.value.lastIndexOf('.')
    const slash = el.value.lastIndexOf('/')
    el.setSelectionRange(slash + 1, dot > slash ? dot : el.value.length)
  }, [])

  const commit = () => {
    if (!draft.trim()) return onCancel()
    if (!onRename(draft)) setInvalid(true)
  }

  return (
    <div className="px-2 py-0.5">
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setInvalid(false)
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') onCancel()
        }}
        spellCheck={false}
        aria-label="File name"
        className={cn(
          'h-7 w-full rounded border bg-background px-2 font-mono text-xs outline-none ring-1',
          invalid
            ? 'border-danger ring-danger/40'
            : 'border-brand ring-brand/40'
        )}
      />
    </div>
  )
}

const FileRow: FC<{
  path: string
  active: boolean
  editing: boolean
  canDelete: boolean
  onSelect: () => void
  onStartRename: () => void
  onRename: (to: string) => boolean
  onCancelRename: () => void
  onDelete: () => void
}> = ({
  path,
  active,
  editing,
  canDelete,
  onSelect,
  onStartRename,
  onRename,
  onCancelRename,
  onDelete
}) => {
  const { dir, name } = splitPath(path)

  if (editing) {
    return (
      <RenameInput path={path} onRename={onRename} onCancel={onCancelRename} />
    )
  }

  return (
    <div
      className={cn(
        'group flex h-7 items-center rounded-md pr-1 text-xs transition-colors',
        active
          ? 'bg-accent text-foreground'
          : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
      )}
    >
      <button
        type="button"
        className="flex h-full min-w-0 flex-1 items-center gap-2 pl-2 text-left"
        onClick={onSelect}
        onDoubleClick={onStartRename}
        title={`${path} (double-click to rename)`}
      >
        <FileIcon
          path={path}
          className={cn('h-3.5 w-3.5 shrink-0', active && 'text-brand')}
        />
        <span className="truncate font-mono">
          {dir && <span className="opacity-50">{dir}</span>}
          {name}
        </span>
      </button>
      {canDelete && (
        <button
          type="button"
          className="hidden h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-danger/15 hover:text-danger group-hover:flex"
          onClick={onDelete}
          title="Delete file"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

export const FileExplorer: FC = () => {
  const files = useStore((s) => s.files)
  const activeFile = useStore((s) => s.activeFile)
  const setActiveFile = useStore((s) => s.setActiveFile)
  const configPath = useStore((s) => s.configPath)
  const addFile = useStore((s) => s.addFile)
  const renameFile = useStore((s) => s.renameFile)
  const removeFile = useStore((s) => s.removeFile)
  const [editing, setEditing] = useState<string | null>(null)

  const paths = Object.keys(files)

  return (
    <aside className="flex h-full flex-col overflow-hidden bg-surface">
      <div className="flex h-9 shrink-0 items-center justify-between pl-4 pr-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Files
        </span>
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          onClick={() => setEditing(addFile())}
          title="New file"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 space-y-px overflow-y-auto px-2">
        {paths.map((path) => (
          <FileRow
            key={path}
            path={path}
            active={activeFile === path}
            editing={editing === path}
            canDelete={paths.length > 1}
            onSelect={() => setActiveFile(path)}
            onStartRename={() => setEditing(path)}
            onRename={(to) => {
              const ok = renameFile(path, to)
              if (ok) setEditing(null)
              return ok
            }}
            onCancelRename={() => setEditing(null)}
            onDelete={() => removeFile(path)}
          />
        ))}
      </div>
      <div className="shrink-0 border-t px-2 py-2">
        <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Config
        </div>
        <button
          type="button"
          className={cn(
            'flex h-7 w-full items-center gap-2 rounded-md px-2 text-left font-mono text-xs transition-colors',
            activeFile === configPath
              ? 'bg-accent text-foreground'
              : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
          )}
          onClick={() => setActiveFile(configPath)}
        >
          <Braces
            className={cn(
              'h-3.5 w-3.5 shrink-0',
              activeFile === configPath && 'text-brand'
            )}
          />
          {configPath.slice(1)}
        </button>
      </div>
    </aside>
  )
}
