import {
  darkMode,
  themeColors,
  themePlugin
} from 'tailwindcss-dark-mode-plugin'
import plugin from 'tailwindcss/plugin'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode,
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    colors: themeColors,
    extend: {}
  },
  plugins: [plugin(themePlugin)],
}