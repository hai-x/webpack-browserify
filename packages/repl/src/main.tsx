import { ThemeProvider } from '@/components/theme-provider'
import { inject } from '@vercel/analytics'
import ReactDOM from 'react-dom/client'
import 'react-toastify/dist/ReactToastify.css'
import '../app/globals.css'
import App from './App.tsx'

inject()

// biome-ignore lint/style/noNonNullAssertion: <explanation>
ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <App />
  </ThemeProvider>
  // </React.StrictMode>
)
