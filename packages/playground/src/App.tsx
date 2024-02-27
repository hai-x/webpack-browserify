import { ModeToggle } from '@/components/mode-toggle'
import { GitHubLogoIcon } from '@radix-ui/react-icons'
import { FC } from 'react'
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
      className="sticky top-0 pt-8"
      style={{ backgroundColor: 'hsl(var(--background))' }}
    >
      <div className="flex">
        <div className="flex-1">
          <h1 className="flex items-center">
            <span className="scroll-m-20 text-2xl font-extrabold tracking-tight lg:text-3xl">
              Webpack Browserify Playground
            </span>
          </h1>
        </div>

        <div className="basis-32 flex gap-2 flex-row">
          <WebpackOptions />
          <Github />
          <ModeToggle />
        </div>
      </div>
      <hr className="my-2" />
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
    </div>
  )
}

export default App
