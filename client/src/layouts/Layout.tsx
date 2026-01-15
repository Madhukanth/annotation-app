import { FC, useState } from 'react'
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom'

import { HEADER_HEIGHT } from '@renderer/constants'
import HeaderLayout from './HeaderLayout'
import LoadData from '@/components/modals/LoadData'

const Layout: FC = () => {
  const { orgid: orgId } = useParams()
  const [open, setOpen] = useState(false)

  const location = useLocation()
  const isProjectPage = location.pathname === `/orgs/${orgId}/projects`

  if (!orgId) {
    return <Navigate to="/not-found" />
  }

  return (
    <div className="min-h-screen w-screen bg-muted/30">
      {/* Header */}
      <div style={{ height: `${HEADER_HEIGHT}px` }}>
        <HeaderLayout open={open} toggleOpen={() => setOpen(!open)} />
      </div>

      {/* Main Content */}
      <div
        className="w-full lg:w-[calc(100vw-220px)] lg:ml-[220px]"
        style={{ minHeight: `calc(100vh - ${HEADER_HEIGHT}px)` }}
      >
        <div className="p-6">
          <div
            style={{ minHeight: `calc(100vh - ${HEADER_HEIGHT}px - 48px)` }}
            className="bg-card rounded-xl border shadow-sm p-6"
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
