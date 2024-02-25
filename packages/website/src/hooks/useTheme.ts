import { useState } from 'react'

const prefix = 'demo'

const _storage = {
  get theme() {
    return localStorage.getItem(`${prefix}_theme`)
  },
  set theme(v: string | null) {
    if (v) localStorage.setItem(`${prefix}_theme`, v)
    else localStorage.removeItem(`${prefix}_theme`)
  }
}

export const initTheme = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  if (
    _storage.theme === 'dark' ||
    (!_storage.theme &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  )
    document.documentElement.setAttribute('theme', 'dark')
}

export const useTheme = (): [boolean, () => void] => {
  const [isDark, setIsDark] = useState<boolean>(
    document.documentElement.getAttribute('theme') === 'dark'
  )
  const toggle = () => {
    if (isDark) {
      _storage.theme = 'light'
      document.documentElement.removeAttribute('theme')
      setIsDark(false)
    } else {
      _storage.theme = 'dark'
      document.documentElement.setAttribute('theme', 'dark')
      setIsDark(true)
    }
  }
  return [isDark, toggle]
}
