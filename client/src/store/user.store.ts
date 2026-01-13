import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@renderer/lib/supabase'

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
  isLoading: boolean
  setUser: (user: UserType | null) => void
  updateUser: (partialUser: Partial<UserType>) => void
  signOut: () => Promise<void>
  checkSession: () => Promise<void>
}

export const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,

      setUser(user) {
        set(() => ({ user, isLoading: false }))
      },

      updateUser(partialUser) {
        const currUser = get().user
        if (!currUser) return

        set(() => ({ user: { ...currUser, ...partialUser } }))
      },

      async signOut() {
        await supabase.auth.signOut()
        set(() => ({ user: null, isLoading: false }))
      },

      async checkSession() {
        try {
          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (session) {
            // Get user profile from public.users
            const { data: profile, error } = await supabase
              .from('users')
              .select('id, name, email, role')
              .eq('id', session.user.id)
              .single()

            if (profile && !error) {
              set(() => ({
                user: profile as UserType,
                isLoading: false,
              }))
              return
            }
          }

          set(() => ({ user: null, isLoading: false }))
        } catch (error) {
          console.error('Error checking session:', error)
          set(() => ({ user: null, isLoading: false }))
        }
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
)

