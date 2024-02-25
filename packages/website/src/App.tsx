import Webpack from './Webpack'
import ThemeSwitchButton from './components/theme-switch-button'

function App() {
  return (
    <>
      <div className="bg-neutral-200">
        <ThemeSwitchButton />
        <Webpack />
      </div>
    </>
  )
}

export default App
