import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import OrganizationType from '@models/Organization.model'

type OrganizationStoreState = {
  orgs: OrganizationType[]
  setOrgs: (orgList: OrganizationType[]) => void

  selectedOrg: string | null
  setSelectedOrg: (orgId: string | null) => void

  clearOrgs: () => void
}

export const useOrgStore = create<OrganizationStoreState>()(
  persist(
    (set) => ({
      orgs: [],
      setOrgs(orgList) {
        set(() => ({ orgs: orgList }))
      },

      selectedOrg: null,
      setSelectedOrg(orgId) {
        set(() => ({ selectedOrg: orgId }))
      },

      clearOrgs() {
        set(() => ({ orgs: [], selectedOrg: null }))
      }
    }),
    {
      name: 'org-storage'
    }
  )
)
