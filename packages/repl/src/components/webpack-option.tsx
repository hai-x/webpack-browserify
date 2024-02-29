import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { GearIcon } from '@radix-ui/react-icons'
import { FC, useState } from 'react'

declare global {
  interface Window {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    __webpack_config__: Record<string, any>
  }
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function evalValue<T = any>(rawValue: string): T {
  const fn = new Function(`
    var console = {}, exports = {}, global = globalThis, module = {}, process = {}, require
    (\n${rawValue}\n)
    return module
  `)
  return fn()
}

window.__webpack_config__ = {
  mode: 'production',
  entry: {
    index: '/index.js'
  },
  output: {
    clean: true
  }
}

const WebpackOptions: FC = () => {
  const [v, setV] = useState(
    `module.exports = ${JSON.stringify(window.__webpack_config__)}`
  )
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <GearIcon className="h-[1.2rem] w-[1.2rem]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="p-4 w-72">
        <div className="mb-2 flex space-y-2 flex-col">
          <Label htmlFor="webpack-version">Version</Label>
          <Input
            id="webpack-version"
            className="space-y-2"
            value="5.90.3"
            disabled
          />
        </div>
        <div className="mb-2 flex space-y-2 flex-col">
          <Label htmlFor="webpack-options">Options</Label>
          <Textarea
            id="webpack-options"
            className="h-60 mb-4"
            placeholder="Type Webpack config here."
            value={v}
            onChange={(e) => {
              setV(e.target.value)
            }}
          />
        </div>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            try {
              const module = evalValue(v)
              window.__webpack_config__ = module.exports
            } catch (e) {
              console.log(e)
              window.__webpack_config__ = {}
            }
          }}
        >
          Set Webpack Config
        </Button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default WebpackOptions
