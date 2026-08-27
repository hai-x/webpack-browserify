import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatBytes = (n: number) =>
  n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} kB`
