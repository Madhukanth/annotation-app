import { Suspense, useEffect, useState } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, useRouteError } from 'react-router-dom'

import HomePage from '@renderer/pages/HomePage'
import Layout from './layouts/Layout'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProtectedRoutes from './components/guards/ProtectedRoute'
import { useUserStore } from './store/user.store'
import ProjectsListPage from './pages/ProjectsListPage'
import AddProject from './pages/AddProject'
import InvitationsPage from './pages/InvitationsPage'
import EditProject from './pages/EditProject'
import AnnotatePage from './pages/AnnotatePage'
import ClassifyPage from './pages/ClassifyPage'
import { useOrgStore } from './store/organization.store'
import { useClassesStore } from './store/classes.store'
import InviteLayout from './layouts/InviteLayout'
import Loader from './components/common/Loader'
import OnlyAdminRoutes from './components/guards/OnlyAdminRoute'
import AdminPage from './pages/AdminPage'
import ProjectDashboard from './pages/ProjectDashboard'
import ProjectInstructions from './components/ProjectView/ProjectInstructions/ProjectInstructions'
import ProjectMembers from './pages/ProjectMembers'
import ProjectAnnotate from './components/ProjectView/ProjectAnnotate/ProjectAnnotate'
import ProjectReview from './components/ProjectView/ProjectReview/ProjectReview'
import Classes from './pages/Classes/Classes'
import ProjectStats from './pages/ProjectStats'
import ProjectMemberGuard from './components/guards/ProjectMemberItem'
import { organizationsKeys } from '@/hooks/useOrganizations'
import { supabase } from '@/lib/supabase'
import { organizationsService } from './services/supabase'
import { useQuery } from '@tanstack/react-query'

function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)

  return <Navigate to="" />
}

const router = createBrowserRouter([
  { path: '', element: <HomePage />, errorElement: <ErrorBoundary /> },
  { path: 'login', element: <LoginPage />, errorElement: <ErrorBoundary /> },
  { path: 'signup', element: <SignupPage />, errorElement: <ErrorBoundary /> },
  {
    path: 'invites', // '/invites'
    element: (
      <ProtectedRoutes>
        <InviteLayout />
      </ProtectedRoutes>
    ),
    children: [{ index: true, element: <InvitationsPage />, errorElement: <ErrorBoundary /> }]
  },
  {
    path: 'admin',
    element: (
      <OnlyAdminRoutes>
        <InviteLayout />
      </OnlyAdminRoutes>
    ),
    children: [{ index: true, element: <AdminPage />, errorElement: <ErrorBoundary /> }]
  },
  {
    path: 'orgs/:orgid/projects', // '/orgs/someorgid/projects'
    element: (
      <ProtectedRoutes>
        <Layout />
      </ProtectedRoutes>
    ),
    children: [
      { index: true, element: <ProjectsListPage />, errorElement: <ErrorBoundary /> },
      {
        path: ':projectid', // '/orgs/someorgid/projects/someprojectid'
        children: [
          { path: 'edit', element: <EditProject />, errorElement: <ErrorBoundary /> },
          { path: 'dashboard', element: <ProjectDashboard />, errorElement: <ErrorBoundary /> },
          {
            path: 'instruction',
            element: <ProjectInstructions />,
            errorElement: <ErrorBoundary />
          },
          {
            path: 'members',
            element: (
              <ProjectMemberGuard allowed={['dataManager']}>
                <ProjectMembers />
              </ProjectMemberGuard>
            ),
            errorElement: <ErrorBoundary />
          },
          {
            path: 'images',
            element: (
              <ProjectMemberGuard allowed={['dataManager', 'annotator']}>
                <ProjectAnnotate />
              </ProjectMemberGuard>
            ),
            errorElement: <ErrorBoundary />
          },
          {
            path: 'review',
            element: (
              <ProjectMemberGuard allowed={['dataManager', 'reviewer']}>
                <ProjectReview />
              </ProjectMemberGuard>
            ),
            errorElement: <ErrorBoundary />
          },
          { path: 'classes', element: <Classes />, errorElement: <ErrorBoundary /> },
          { path: 'stats', element: <ProjectStats />, errorElement: <ErrorBoundary /> }
        ]
      },
      { path: 'add', element: <AddProject />, errorElement: <ErrorBoundary /> } // '/orgs/someorgid/projects/add'
    ]
  },
  {
    path: 'annotate/orgs/:orgid/projects/:projectid',
    element: (
      <ProtectedRoutes>
        <Suspense fallback={<Loader />}>
          <AnnotatePage />
        </Suspense>
      </ProtectedRoutes>
    )
  },
  {
    path: 'review/orgs/:orgid/projects/:projectid',
    element: (
      <ProtectedRoutes>
        <Suspense fallback={<Loader />}>
          <AnnotatePage />
        </Suspense>
      </ProtectedRoutes>
    )
  },
  {
    path: 'classify/orgs/:orgid/projects/:projectid',
    element: (
      <ProtectedRoutes>
        <Suspense fallback={<Loader />}>
          <ClassifyPage />
        </Suspense>
      </ProtectedRoutes>
    )
  },
  {
    path: 'review-classify/orgs/:orgid/projects/:projectid',
    element: (
      <ProtectedRoutes>
        <Suspense fallback={<Loader />}>
          <ClassifyPage />
        </Suspense>
      </ProtectedRoutes>
    )
  }
])

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
  // This is more reliable than getSession() which can hang
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
        // Get user profile from public.users table
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
      // Only set selectedOrg if not already set or if current selection is invalid
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
