import { FC, useState } from 'react'
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'

import { HEADER_HEIGHT } from '@renderer/constants'
import HeaderLayout from './HeaderLayout'
import LoadData from '@renderer/components/LoadData'

const Layout: FC = () => {
  const { orgid: orgId } = useParams()
  const [open, setOpen] = useState(false)

  const location = useLocation()
  const isProjectPage = location.pathname === `/orgs/${orgId}/projects`

  if (!orgId) {
    return <Navigate to="/not-found" />
  }

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
        <div className="p-4">
          <div
            style={{ height: `calc(100vh - ${HEADER_HEIGHT}px - 32px)` }}
            className="bg-white p-4 rounded-md"
          >
            {isProjectPage ? (
              <Outlet />
            ) : (
              <LoadData>
                <Outlet />
              </LoadData>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Layout
