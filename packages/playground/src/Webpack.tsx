import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Cross2Icon } from '@radix-ui/react-icons'
import { FC, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import browserifyWebpack, { fs } from 'webpack-browserify'
import { createStore } from 'zustand/vanilla'
import { Button } from './components/ui/button'
import { Label } from './components/ui/label'

const useOutsideClick = (callback: () => void, dep: unknown[]) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (event: Event) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        console.log(111)

        callback()
      }
    }

    document.addEventListener('click', handleClick, true)

    return () => {
      document.removeEventListener('click', handleClick, true)
    }
  }, [callback, ...dep])

  return ref
}

type Store = {
  input: Record<string, string>
  addInput: (p: string, v: string) => void
  renameInput: (op: string, np: string) => void
  removeInput: (p: string) => void
  output: Record<string, string | null>
  setOutput: (v?: Record<string, string | null>) => void
}
const store = createStore<Store>((set) => ({
  input: {},
  addInput: (p, v) => {
    fs.vol.writeFileSync(p, v)
    set((state) => {
      const r = {
        ...state.input,
        [p]: v
      }
      return {
        input: r
      }
    })
  },
  removeInput: (p) => {
    fs.vol.rmSync(p)
    set((state) => {
      const ns = { ...state.input }
      delete ns[p]
      return {
        input: ns
      }
    })
  },
  renameInput: (op, np) => {
    fs.vol.renameSync(op, np)
    set((state) => {
      const ns = { ...state.input }
      const v = ns[op]
      delete ns[op]
      ns[np] = v
      return {
        input: ns
      }
    })
  },
  output: {},
  setOutput: (o) => {
    set({
      output: o || fs.vol.toJSON('/')
    })
  }
}))

const { getState, subscribe } = store

const { addInput, setOutput, removeInput } = getState()

addInput('/index.js', 'console.log(1+1)')

setTimeout(() => {
  compile()
}, 100)

const compile = () => {
  if (window.__webpack_config__?.output?.clean && fs.vol.existsSync('dist')) {
    fs.vol.rmdirSync('dist', { recursive: true })
    setOutput({})
  }
  browserifyWebpack(window.__webpack_config__, (err, stat) => {
    console.info('[webpack-browserify] output: ', fs.vol.toJSON('/'))
    setOutput()
  })
}

const FileNameInput: FC<{
  fileName: string
  setFileName: (v: string) => void
}> = ({ fileName, setFileName }) => {
  const [isEdit, setIsEdit] = useState(false)
  const [v, setV] = useState(fileName)
  const handleClickOutside = () => {
    setFileName(v)
    setIsEdit(false)
  }

  const clickAreaRef = useOutsideClick(handleClickOutside, [v])

  return (
    <div className="font-bold leading-10 text-lg h-10 flex items-center justify-between">
      {isEdit ? (
        <div ref={clickAreaRef}>
          <Input
            className="h-5"
            value={v}
            onChange={(e) => setV(e.target.value)}
          />
        </div>
      ) : (
        // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
        <div
          className="hover:cursor-text"
          onClick={() => {
            setIsEdit(true)
          }}
        >
          {fileName}
        </div>
      )}
      <Button
        size="sm"
        variant="link"
        className="p-0"
        onClick={() => {
          removeInput(fileName)
        }}
      >
        <Cross2Icon />
      </Button>
    </div>
  )
}

const Webpack: FC = () => {
  const defaultFileName = useRef('/module.js')

  const getDefaultFileName = () => {
    const v = defaultFileName.current
    if (v in input) {
      const match = v.match(/(.*)\/([^\/]+)\.(\w+)$/)
      if (!match?.[3]) return new Error('getDefaultFileName fail')
      match[2] += 1
      const newV = `${match[1]}/${match[2]}.${match[3]}`
      defaultFileName.current = newV
      return newV
    }
    return v
  }

  const { input, renameInput, output } = useSyncExternalStore((s) => {
    const un = subscribe(s)
    return un
  }, getState)

  return (
    <>
      <div className="flex h-max">
        <div className="flex-1 h-max overflow-scroll p-2">
          {Object.keys(input).map((key) => {
            const v = input[key]
            return (
              <div key={key}>
                <FileNameInput
                  fileName={key}
                  setFileName={(v) => {
                    renameInput(key, v)
                  }}
                />
                <Textarea
                  className="h-40"
                  placeholder="Type your code here."
                  id={`${key}-input`}
                  value={v}
                  onChange={(e) => {
                    addInput(key, e.target.value)
                  }}
                />
              </div>
            )
          })}
          <div className="sticky bottom-0 z-50 flex flex-col gap-3 mt-3">
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => {
                addInput(getDefaultFileName() as string, '')
              }}
            >
              Add New Module
            </Button>
            <Button
              className="w-full"
              onClick={() => {
                compile()
              }}
            >
              Compile
            </Button>
          </div>
        </div>
        <div className="flex-1 h-max overflow-scroll p-2">
          {Object.keys(output)
            .filter((i) => i.startsWith('/dist'))
            .map((key) => {
              const v = output[key]
              if (!v) return
              return (
                <div key={key}>
                  <Label
                    htmlFor={`${key}-output`}
                    className="font-bold leading-10 text-lg block h-10 flex items-center"
                  >
                    {key}
                  </Label>
                  <Textarea
                    className="h-40"
                    placeholder="Type your code here."
                    value={v}
                  />
                </div>
              )
            })}
        </div>
      </div>
    </>
  )
}

export default Webpack
