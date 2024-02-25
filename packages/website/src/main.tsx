import React from 'react'
import ReactDOM from 'react-dom/client'
import '../app/globals.css'
import App from './App.tsx'
import { initTheme } from './hooks/useTheme.ts'

initTheme()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
