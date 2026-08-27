import { inject } from '@vercel/analytics'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from '@/components/theme-provider'
import '@/lib/monaco'
import '../app/globals.css'
import App from './App.tsx'

inject()

// oxlint-disable-next-line typescript/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider defaultTheme="dark">
    <App />
  </ThemeProvider>
)
