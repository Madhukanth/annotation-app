import { FC, HTMLProps, ReactNode } from 'react'

import { cn } from '@renderer/utils/cn'
import { Link } from 'react-router-dom'

type OutlineButtonProps = {
  children: ReactNode
  onClick?: () => void
  link?: boolean
  to?: string
  disabled?: boolean
  className?: HTMLProps<HTMLElement>['className']
}
const OutlineButton: FC<OutlineButtonProps> = ({
  children,
  className,
  link,
  to,
  disabled,
  onClick
}) => {
  if (link && to) {
    return (
      <Link
        to={to}
        className={cn(
          'py-2 px-3 rounded-2xl text-xs text-button border border-font-0.14 disabled:opacity-50',
          className
        )}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'py-2 px-3 rounded-2xl text-xs text-button border border-font-0.14 disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  )
}

export default OutlineButton
