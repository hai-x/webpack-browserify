import { FC } from 'react'

export const Logo: FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
    <path
      d="M16 2 4 8.5v15L16 30l12-6.5v-15Z"
      className="fill-brand/20 stroke-brand"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M16 8.5 9 12.4v7.2l7 3.9 7-3.9v-7.2Z" className="fill-brand" />
    <path
      d="M16 8.5v15M9 12.4l7 3.8 7-3.8"
      className="stroke-background"
      strokeWidth="1.2"
      strokeLinejoin="round"
      fill="none"
    />
  </svg>
)
