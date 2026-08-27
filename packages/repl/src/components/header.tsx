import { Check, Github, Loader2, PanelLeft, Play, Share2 } from 'lucide-react'
import { FC, useState } from 'react'
import { Logo } from '@/components/logo'
import { ModeToggle } from '@/components/mode-toggle'
import { Button } from '@/components/ui/button'
import { writeSnapshotToUrl } from '@/lib/share'
import { cn } from '@/lib/utils'
import { useStore } from '@/store'

const isMac = /Mac|iPhone|iPad/.test(navigator.platform)

export const Header: FC = () => {
  const status = useStore((s) => s.status)
  const autoBuild = useStore((s) => s.autoBuild)
  const toggleAutoBuild = useStore((s) => s.toggleAutoBuild)
  const toggleSidebar = useStore((s) => s.toggleSidebar)
  const build = useStore((s) => s.build)
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const { files, config, configPath, version, rspackVersion } =
      useStore.getState()
    const url = writeSnapshotToUrl({
      files,
      config,
      configPath,
      version,
      rspackVersion
    })
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // clipboard unavailable, url is in the address bar
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b bg-surface px-3">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground"
        onClick={toggleSidebar}
        title="Toggle explorer"
      >
        <PanelLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-2.5">
        <Logo className="h-6 w-6" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-semibold tracking-tight">webpack</span>
          <span className="text-sm text-muted-foreground">playground</span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          role="switch"
          aria-checked={autoBuild}
          onClick={toggleAutoBuild}
          className="flex h-8 items-center gap-2 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Rebuild on every change"
        >
          <span
            className={cn(
              'relative block h-4 w-7 rounded-full transition-colors',
              autoBuild ? 'bg-brand' : 'bg-muted-foreground/40'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 block h-3 w-3 rounded-full bg-white shadow transition-transform',
                autoBuild ? 'translate-x-3.5' : 'translate-x-0.5'
              )}
            />
          </span>
          Auto build
        </button>

        <Button
          size="sm"
          className="h-8 gap-1.5 bg-brand px-3 text-brand-foreground hover:bg-brand/90"
          onClick={build}
          disabled={status === 'building'}
        >
          {status === 'building' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current" />
          )}
          Build
          <kbd className="ml-1 hidden rounded border border-brand-foreground/30 px-1 font-mono text-[10px] opacity-80 sm:inline">
            {isMac ? '⌘' : 'Ctrl'}↵
          </kbd>
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-3"
          onClick={share}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Share2 className="h-3.5 w-3.5" />
          )}
          {copied ? 'Copied' : 'Share'}
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          asChild
          title="GitHub"
        >
          <a
            href="https://github.com/hai-x/webpack-browserify"
            target="_blank"
            rel="noreferrer"
          >
            <Github className="h-4 w-4" />
          </a>
        </Button>
        <ModeToggle />
      </div>
    </header>
  )
}
