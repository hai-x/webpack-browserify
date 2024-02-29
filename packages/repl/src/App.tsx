import { ModeToggle } from '@/components/mode-toggle'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { FC } from 'react'
import { ToastContainer } from 'react-toastify'
import Webpack from './Webpack'
import { Button } from './components/ui/button'
import WebpackOptions from './components/webpack-option'

const Github = () => {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() =>
        window.open('https://github.com/haijie-x/webpack-browserify')
      }
    >
      <GitHubLogoIcon className="h-[1.2rem] w-[1.2rem]" />
    </Button>
  )
}
const Header: FC = () => {
  return (
    <div
      className="sticky top-0 pt-4 z-20"
      style={{ backgroundColor: 'hsl(var(--background))' }}
    >
      <div className="flex">
        <div className="flex-1">
          <h1 className="flex flex-col justify-center">
            <span className="scroll-m-20 text-2xl font-extrabold tracking-tight lg:text-3xl text-slate-700 dark:text-slate-300">
              Webpack Repl
            </span>
            <div className="text-sm	font-extralight mt-1 text-slate-600 dark:text-slate-400">
              Run Webpack in your browser.
            </div>
          </h1>
        </div>

        <div className="basis-32 flex gap-2 flex-row">
          <WebpackOptions />
          <Github />
          <ModeToggle />
        </div>
      </div>
      <hr className="my-4" />
    </div>
  )
}
const App: FC = () => {
  return (
    <div className="md:container md:mx-auto h-full max-h-full flex flex-col px-8">
      <Header />
      <div className="flex-1 h-max">
        <Webpack />
      </div>
      <ToastContainer
        position="bottom-right"
        autoClose={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        theme="light"
      />
    </div>
  )
}

export default App
