import { FC } from 'react'
import { SlUser } from 'react-icons/sl'
import { TbLayoutDashboard } from 'react-icons/tb'
import { NavLink } from 'react-router-dom'

import { cn } from '@renderer/utils/cn'
import { useOrgStore } from '@renderer/store/organization.store'
import { useUserStore } from '@renderer/store/user.store'

const SidebarCore: FC = () => {
  const orgId = useOrgStore((s) => s.selectedOrg)
  const user = useUserStore((s) => s.user)

  const allowed = ['superadmin', 'orgadmin']
  const isAdmin = user && allowed.includes(user.role)

  const isActive = (match: string) => {
    return location.pathname.includes(match)
  }

  return (
    <>
      <div
        className={cn('text-center px-2 py-3 border-l-4', {
          'border-brand': isActive('/projects'),
          'border-transparent': !isActive('/projects')
        })}
      >
        <NavLink to={`/orgs/${orgId}/projects`} className="flex items-center">
          <TbLayoutDashboard className="mr-2" size={20} color="white" />
          Projects
        </NavLink>
      </div>

      {isAdmin && (
        <div
          className={cn('text-center mt-2 px-2 py-3 border-l-4', {
            'border-brand': isActive('/admin'),
            'border-transparent': !isActive('/admin')
          })}
        >
          <NavLink to={'/admin'} className="flex items-center">
            <SlUser className="mr-2" size={20} color="white" />
            Admin
          </NavLink>
        </div>
      )}
    </>
  )
}

export default SidebarCore
