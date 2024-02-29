import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Cross2Icon } from '@radix-ui/react-icons'
import { FC, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { toast } from 'react-toastify'
import browserifyWebpack, { fs } from 'webpack-browserify'
import { createStore } from 'zustand/vanilla'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader } from './components/ui/card'
import { Label } from './components/ui/label'

declare global {
  interface Window {
    _toast_ids: (number | string)[]
  }
}

const fns: ['warn', 'error', 'success'] = ['warn', 'error', 'success']
for (const fnName of fns) {
  const rawFn = toast[fnName]
  toast[fnName] = ((...args: Parameters<typeof toast.warn>) => {
    const id = rawFn(...args)
    window._toast_ids = window._toast_ids || []
    window._toast_ids.push(id)
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  }) as any
}

const useOutsideClick = (callback: () => void, dep: unknown[]) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (event: Event) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
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

function sortObject<T extends Record<string, unknown>>(obj: T) {
  const sortedKeys = Object.keys(obj).sort()
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const sortedObj: any = {}
  // biome-ignore lint/complexity/noForEach: <explanation>
  sortedKeys.forEach((key) => {
    sortedObj[key] = obj[key]
  })
  return sortedObj
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
        input: sortObject(r)
      }
    })
  },
  removeInput: (p) => {
    fs.vol.rmSync(p)
    set((state) => {
      const ns = { ...state.input }
      delete ns[p]
      return {
        input: sortObject(ns)
      }
    })
  },
  renameInput: (op, np) => {
    if (op === np) return
    fs.vol.renameSync(op, np)
    set((state) => {
      const ns = { ...state.input }
      const v = ns[op]
      delete ns[op]
      ns[np] = v
      return {
        input: sortObject(ns)
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
  browserifyWebpack(
    {
      ...window.__webpack_config__,
      plugins: [
        ...(window.__webpack_config__?.plugin || []),
        (compiler) => {
          compiler.hooks.done.tap('ToastFailedModule', (stats) => {
            const statsJson = stats.toJson('verbose') || {}
            const { warnings, errors, time } = statsJson
            // biome-ignore lint/complexity/noForEach: <explanation>
            warnings?.forEach((w) => toast.warn(w.message))
            if (errors?.length) {
              toast.error(
                `Compiled with ${errors.length} errors in ${time} ms`,
                {
                  autoClose: 2000
                }
              )
              // biome-ignore lint/complexity/noForEach: <explanation>
              errors?.forEach((e) => toast.error(e.message))
            } else {
              toast.success(`Compiled successfully in ${time} ms`, {
                autoClose: 2000
              })
            }
          })
        }
      ]
    },
    (err) => {
      err && toast(err.message)
      console.info('[webpack-browserify] output: ', fs.vol.toJSON('/'))
      setOutput()
    }
  )
}

const FileNameInput: FC<{
  fileName: string
  setFileName: (v: string) => void
}> = ({ fileName, setFileName }) => {
  const [isEdit, setIsEdit] = useState(false)
  const [v, setV] = useState(fileName)

  const _set = () => {
    setFileName(v)
    setIsEdit(false)
  }
  const clickAreaRef = useOutsideClick(_set, [v])

  return (
    <div className="leading-8 h-8 flex items-center justify-between">
      {isEdit ? (
        <div ref={clickAreaRef}>
          <Input
            className="h-5"
            value={v}
            onChange={(e) => setV(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && _set()}
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
  const defaultFileName = useRef('/index.js')

  const getDefaultFileName = () => {
    const v = defaultFileName.current
    if (v in input) {
      const match = v.match(/(.*)\/([^\/]+)\.(\w+)$/)
      if (!match?.[3]) return new Error('getDefaultFileName fail')
      match[2] += 'x'
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
      <div className="flex h-max gap-4">
        <div className="flex-1 h-max overflow-scroll flex flex-col space-y-1.5">
          <Card className="p-0 b rounded-none	">
            <CardHeader className="p-0">
              <div className="px-4 py-2 bg-slate-200 dark:bg-slate-400 text-slate-600 dark:text-slate-800 text-center text-lg font-extrabold">
                Input
              </div>
            </CardHeader>
            <CardContent className="px-4 py-2 pb-4">
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
                    // biome-ignore lint/complexity/noForEach: <explanation>
                    ;(window._toast_ids || []).forEach((id) =>
                      toast.dismiss(id)
                    )
                    compile()
                  }}
                >
                  Compile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex-1 h-max overflow-scroll flex flex-col space-y-1.5">
          <Card className="p-0 b rounded-none	">
            <CardHeader className="p-0">
              <div className="px-4 py-2 bg-slate-200 dark:bg-slate-400 text-slate-600 dark:text-slate-800 text-center text-lg font-extrabold">
                Output
              </div>
            </CardHeader>
            <CardContent className="px-4 py-2 pb-4">
              {Object.keys(output)
                .filter((i) => i.startsWith('/dist'))
                .map((key) => {
                  const v = output[key]
                  if (!v) return
                  return (
                    <div key={key}>
                      <Label
                        htmlFor={`${key}-output`}
                        className="leading-8 h-8 flex items-center"
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
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

export default Webpack
