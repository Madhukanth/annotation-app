import { FC } from 'react'
import { FiLogOut } from 'react-icons/fi'
import { FaUser } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { SingleValue } from 'react-select'

import CustomSelect from '../common/Select'
import HoverAndClickTooltip from '../common/HoverAndClickTooltip'
import { useUserStore } from '@renderer/store/user.store'
import { useOrgStore } from '@renderer/store/organization.store'
import { clearAuthTokenFromCookie } from '@renderer/helpers/cookie'
import { useOrganizations } from '@/hooks/useOrganizations'
import { supabase } from '@/lib/supabase'

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

  return (
    <div className="flex items-center space-x-3 pr-4">
      <CustomSelect
        value={{
          value: selectedOrgOption?.id || '',
          label: selectedOrgOption?.name || ''
        }}
        options={orgOptions}
        onChange={handleOrgChange}
      />
      <HoverAndClickTooltip
        hoverChildren={<></>}
        clickAlign="bottom-end"
        clickChildren={() => (
          <div className="p-2 rounded-lg shadow-md bg-white text-center w-44">
            <p className="overflow-hidden text-ellipsis whitespace-nowrap">{user?.name || '-'}</p>
            <hr className="my-2" />
            <button
              className="flex items-center gap-2 justify-center w-full"
              onClick={handleLogout}
            >
              Logout
              <FiLogOut />
            </button>
          </div>
        )}
        move={19}
      >
        <button className="text-brand1">
          <FaUser size={23} />
        </button>
      </HoverAndClickTooltip>
    </div>
  )
}

export default HeaderCore
