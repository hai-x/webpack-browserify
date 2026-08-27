import { FC, useEffect } from 'react'
import { ConsolePanel } from '@/components/console-panel'
import { EditorPane } from '@/components/editor-pane'
import { FileExplorer } from '@/components/file-explorer'
import { Header } from '@/components/header'
import { Inspector } from '@/components/inspector'
import { SplitPane } from '@/components/split-pane'
import { StatusBar } from '@/components/status-bar'
import { useStore } from '@/store'

const App: FC = () => {
  const files = useStore((s) => s.files)
  const config = useStore((s) => s.config)
  const autoBuild = useStore((s) => s.autoBuild)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const build = useStore((s) => s.build)

  // debounced rebuild on change
  useEffect(() => {
    if (!autoBuild) return
    const t = setTimeout(build, 400)
    return () => clearTimeout(t)
  }, [files, config, autoBuild, build])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        build()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [build])

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background text-foreground">
      <Header />
      <div className="flex min-h-0 flex-1">
        {sidebarOpen && (
          <div className="w-56 shrink-0 border-r">
            <FileExplorer />
          </div>
        )}
        <SplitPane
          direction="horizontal"
          defaultRatio={0.45}
          className="flex-1"
        >
          <EditorPane />
          <SplitPane direction="vertical" defaultRatio={0.74} min={0.12}>
            <Inspector />
            <ConsolePanel />
          </SplitPane>
        </SplitPane>
      </div>
      <StatusBar />
    </div>
  )
}

export default App
