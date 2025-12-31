import { create } from 'zustand'

export const userRoles = ['superadmin', 'orgadmin', 'user'] as const
export type UserRoleType = (typeof userRoles)[number]

export const inviteRoles = ['datamanager', 'reviewer', 'annotator'] as const
export type InviteRoleType = (typeof inviteRoles)[number]

export const inviteStatus = ['pending', 'accepted', 'declined'] as const
export type InviteStatusType = (typeof inviteStatus)[number]

export type UserType = {
  id: string
  name: string
  email: string
  role: UserRoleType
}

type UserStoreState = {
  user: null | UserType
  setUser: (user: UserType | null) => void
  updateUser: (partialUser: Partial<UserType>) => void
}

export const useUserStore = create<UserStoreState>((set, get) => ({
  user: null,
  setUser(user) {
    set(() => ({ user }))
  },
  updateUser(partialUser) {
    const currUser = get().user
    if (!currUser) return

    set(() => ({ user: { ...currUser, ...partialUser } }))
  }
}))
