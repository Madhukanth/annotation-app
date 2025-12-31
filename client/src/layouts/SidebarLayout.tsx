import { FC } from 'react'

import { SIDEBAR_WIDTH } from '@renderer/constants'
import SidebarCore from '@renderer/components/Sidebar/SidebarCore'

const SidebarLayout: FC = () => {
  return (
    <div className="h-full bg-brand1 text-white pt-4" style={{ width: `${SIDEBAR_WIDTH}px` }}>
      <SidebarCore />
    </div>
  )
}

export default SidebarLayout
