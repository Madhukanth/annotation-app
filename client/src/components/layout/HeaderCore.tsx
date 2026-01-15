import { FC } from 'react'
import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { SingleValue } from 'react-select'

import CustomSelect from '@/components/ui/Select'
import { useUserStore } from '@renderer/store/user.store'
import { useOrgStore } from '@renderer/store/organization.store'
import { clearAuthTokenFromCookie } from '@renderer/helpers/cookie'
import { useOrganizations } from '@/hooks/useOrganizations'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const HeaderCore: FC = () => {
  const navigate = useNavigate()

  const user = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)

  const orgId = useOrgStore((s) => s.selectedOrg)
  const setSelectedOrg = useOrgStore((s) => s.setSelectedOrg)

  const { data: organizations = [] } = useOrganizations(user?.id || '')

  const orgOptions = organizations.map((org) => ({
    value: org.id,
    label: org.name
  }))
  const selectedOrgOption = organizations.find((org) => org.id === orgId)

  const handleLogout = async () => {
    clearAuthTokenFromCookie()
    setUser(null)
    await supabase.auth.signOut()
    navigate('/login')
  }

  const handleOrgChange = (
    selected: SingleValue<{
      value: string | undefined
      label: string | undefined
    }>
  ) => {
    if (selected?.value) {
      setSelectedOrg(selected.value)
      navigate(`/orgs/${selected.value}/projects`)
    }
  }

  // Get user initials for avatar
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  return (
    <div className="flex items-center gap-4">
      <CustomSelect
        value={{
          value: selectedOrgOption?.id || '',
          label: selectedOrgOption?.name || ''
        }}
        options={orgOptions}
        onChange={handleOrgChange}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || ''}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default HeaderCore
