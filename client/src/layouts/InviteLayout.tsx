import { FC, useState } from 'react'
import { Outlet } from 'react-router-dom'

import { HEADER_HEIGHT } from '@renderer/constants'
import HeaderLayout from './HeaderLayout'

const InviteLayout: FC = () => {
  const [open, setOpen] = useState(false)

  return (
    <div className="h-screen w-screen">
      {/* Header */}
      <div style={{ height: `${HEADER_HEIGHT}px` }}>
        <HeaderLayout open={open} toggleOpen={() => setOpen(!open)} />
      </div>

      {/* Routes */}
      <div
        className="bg-gray-200 w-full lg:w-[calc(100vw-200px)] lg:ml-[200px]"
        style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}
      >
        <Outlet />
      </div>
    </div>
  )
}

export default InviteLayout
