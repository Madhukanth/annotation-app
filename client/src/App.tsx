/**
 * Application Root Component
 * Handles authentication state and renders routes
 */

import { useEffect, useState } from 'react'
import { RouterProvider } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { router } from '@/routes'
import { supabase } from '@/utils/supabase'
import { useUserStore } from '@/store/user.store'
import { useOrgStore } from '@/store/organization.store'
import { useClassesStore } from '@/store/classes.store'
import { organizationsKeys } from '@/hooks/useOrganizations'
import { organizationsService } from '@/services/supabase'
import Loader from '@/components/ui/Loader'

const App = () => {
  const user = useUserStore((s) => s.user)
  const setUser = useUserStore((s) => s.setUser)
  const [authInitialized, setAuthInitialized] = useState(false)
  const setSelectedOrg = useOrgStore((s) => s.setSelectedOrg)
  const setOrgs = useOrgStore((s) => s.setOrgs)
  const clearOrgs = useOrgStore((s) => s.clearOrgs)
  const setSelectedTagIds = useClassesStore((state) => state.setSelectedTagIds)

  // Fetch organizations when user is available
  const { data: organizations = [], isFetching: fetchingOrgs } = useQuery({
    queryKey: organizationsKeys.list(user?.id || ''),
    queryFn: () => organizationsService.getOrganizations(user?.id || ''),
    enabled: !!user?.id && authInitialized,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })

  // Use onAuthStateChange for both initial session and subsequent changes
  useEffect(() => {
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email)

      // Handle sign out specifics
      if (event === 'SIGNED_OUT') {
        setUser(null)
        clearOrgs()
        setSelectedTagIds([])
        setAuthInitialized(true)
        return
      }

      // Handle user session
      if (session?.user) {
        const fetchProfile = async () => {
          try {
            const { data: userProfile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single()

            if (userProfile) {
              setUser({
                id: userProfile.id,
                name: userProfile.name,
                email: userProfile.email,
                role: userProfile.role
              })
            } else {
              setUser(null)
            }
          } catch {
            setUser(null)
          } finally {
            setAuthInitialized(true)
          }
        }
        fetchProfile()
      } else {
        setUser(null)
        setAuthInitialized(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, clearOrgs, setSelectedTagIds])

  // Update org store when organizations are fetched
  useEffect(() => {
    if (!authInitialized || fetchingOrgs) return

    if (organizations.length > 0) {
      setOrgs(organizations)
      const currentOrgs = useOrgStore.getState()
      const isCurrentOrgValid =
        currentOrgs.selectedOrg && organizations.some((org) => org.id === currentOrgs.selectedOrg)

      if (!isCurrentOrgValid) {
        setSelectedOrg(organizations[0].id)
      }
    }
    setSelectedTagIds([])
  }, [organizations, authInitialized, fetchingOrgs, setSelectedOrg, setOrgs, setSelectedTagIds])

  // Show loader while auth is initializing
  if (!authInitialized) return <Loader />

  return <RouterProvider router={router} />
}

export default App
