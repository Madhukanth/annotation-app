import { FC } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Mail } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useOrgStore } from '@renderer/store/organization.store'
import { useUserStore } from '@renderer/store/user.store'

const SidebarCore: FC = () => {
  const orgId = useOrgStore((s) => s.selectedOrg)
  const user = useUserStore((s) => s.user)
  const location = useLocation()

  const allowed = ['superadmin', 'orgadmin']
  const isAdmin = user && allowed.includes(user.role)

  const navItems = [
    {
      to: `/orgs/${orgId}/projects`,
      label: 'Projects',
      icon: LayoutDashboard,
      match: '/projects',
    },
    {
      to: `/orgs/${orgId}/invites`,
      label: 'Invites',
      icon: Mail,
      match: '/invites',
    },
    ...(isAdmin
      ? [
          {
            to: '/admin',
            label: 'Admin',
            icon: Users,
            match: '/admin',
          },
        ]
      : []),
  ]

  return (
    <nav className="space-y-1 px-3">
      {navItems.map((item) => {
        const isActive = location.pathname.includes(item.match)
        const Icon = item.icon

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        )
      })}
    </nav>
  )
}

export default SidebarCore
