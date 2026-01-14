import { cn } from '@renderer/utils/cn'
import { FC, ReactNode } from 'react'

type TabProps = { children: ReactNode; active?: boolean; onClick?: () => void }
const Tab: FC<TabProps> = ({ children, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn('py-2 px-3 rounded-t-lg', {
        'bg-white': active
      })}
      style={{ marginBottom: '-2px' }}
    >
      {children}
    </button>
  )
}

export default Tab
