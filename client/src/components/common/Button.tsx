import { FC, HTMLProps, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@renderer/utils/cn'

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  link?: boolean
  to?: string
  disabled?: boolean
  className?: HTMLProps<HTMLElement>['className']
}
const Button: FC<ButtonProps> = ({ children, link, to, className, disabled, onClick }) => {
  if (link && to) {
    return (
      <Link
        to={to}
        className={cn('bg-brand rounded-lg py-2 px-4 text-white disabled:opacity-50', className)}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn('px-4 rounded-lg bg-brand text-white disabled:opacity-50', className)}
    >
      {children}
    </button>
  )
}

export default Button
