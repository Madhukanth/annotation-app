import { create } from 'zustand'

import OrganizationType from '@models/Organization.model'

type OrganizationStoreState = {
  orgs: OrganizationType[]
  setOrgs: (orgList: OrganizationType[]) => void

  selectedOrg: string | null
  setSelectedOrg: (orgId: string | null) => void
}

export const useOrgStore = create<OrganizationStoreState>((set) => ({
  orgs: [],
  setOrgs(orgList) {
    set(() => ({ orgs: orgList }))
  },

  selectedOrg: null,
  setSelectedOrg(orgId) {
    set(() => ({ selectedOrg: orgId }))
  }
}))
