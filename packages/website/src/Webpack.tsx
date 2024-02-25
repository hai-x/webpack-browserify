import browserifyWebpack, { fs } from 'browserify-webpack'
import { FC, useEffect, useState, useSyncExternalStore } from 'react'
import { createStore } from 'zustand/vanilla'

const store = createStore((set) => ({
  input: {},
  setInput: (path, v) => {
    set((state) => {
      const r = {
        ...state.input,
        [path]: v
      }
      fs.vol.fromJSON(r)
      return {
        input: r
      }
    })
  },
  output: {},
  setOutput: () => {
    set({
      output: fs.vol.toJSON('/')
    })
  }
}))

const { getState, setState, subscribe, getInitialState } = store

const { setInput, setOutput } = getState()
setInput('src/index.js', 'console.log(1+1)')

const compiler = browserifyWebpack({
  mode: 'production'
})

compiler.watch(
  {
    poll: 3000
  },
  (err, stat) => {
    console.log(err, stat)
    setOutput(fs.vol.toJSON())
  }
)

const Webpack: FC = () => {
  const [newFileName, setNewFileName] = useState('')
  const { input, setInput, output } = useSyncExternalStore((s) => {
    const un = subscribe(s)
    return un
  }, getState)

  return (
    <>
      <div>
        <h1>Input:</h1>
        {Object.keys(input).map((key, idx) => {
          const v = input[key]
          return (
            <div key={key}>
              {key}:
              <textarea
                value={v}
                onChange={(e) => {
                  setInput(key, e.target.value)
                }}
              />
            </div>
          )
        })}
      </div>
      newFileName:{' '}
      <input
        value={newFileName}
        onChange={(e) => setNewFileName(e.target.value)}
      />
      <button
        onClick={() => {
          setInput(newFileName, '')
          setNewFileName('')
        }}
      >
        NEW FILE
      </button>
      <div>
        <h1>output:</h1>
        {Object.keys(output)
          .filter((i) => i.startsWith('/dist'))
          .map((key, idx) => {
            const v = output[key]
            return (
              <div key={key}>
                {key}: <textarea value={v} />
              </div>
            )
          })}
      </div>
    </>
  )
}

export default Webpack
