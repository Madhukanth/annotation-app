import { Suspense, useCallback, useEffect, useState } from 'react'
import { createBrowserRouter, Navigate, RouterProvider, useRouteError } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import Home from '@renderer/pages/Home'
import Layout from './layouts/Layout'
import Login from './pages/Login'
import { fetchOrganization, setAuthToken, setAxiosDefaults } from './helpers/axiosRequests'
import ProtectedRoutes from './components/ProtectedRoute'
import { useUserStore } from './store/user.store'
import Projects from './pages/Projects'
import AddProject from './pages/AddProject'
import Invites from './pages/Invites'
import EditProject from './pages/EditProject'
import AnnotatePage from './pages/AnnotatePage'
import ClassifyPage from './pages/ClassifyPage'
import { getAuthTokenFromCookie, getUserInfoFromCookie } from './helpers/cookie'
import { useOrgStore } from './store/organization.store'
import { useClassesStore } from './store/classes.store'
import InviteLayout from './layouts/InviteLayout'
import Loader from './components/common/Loader'
import OnlyAdminRoutes from './components/OnlyAdminRoute'
import AdminPage from './pages/AdminPage'
import ProjectDashboard from './pages/ProjectDashboard'
import ProjectInstructions from './components/ProjectView/ProjectInstructions/ProjectInstructions'
import ProjectMembers from './pages/ProjectMembers'
import ProjectAnnotate from './components/ProjectView/ProjectAnnotate/ProjectAnnotate'
import ProjectReview from './components/ProjectView/ProjectReview/ProjectReview'
import Classes from './pages/Classes/Classes'
import ProjectStats from './pages/ProjectStats'
import AllowedProjectMembers from './components/AllowedProjectMember'

function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)

  return <Navigate to="" />
}

const router = createBrowserRouter([
  { path: '', element: <Home />, errorElement: <ErrorBoundary /> },
  { path: 'login', element: <Login />, errorElement: <ErrorBoundary /> },
  {
    path: 'invites', // '/invites'
    element: (
      <ProtectedRoutes>
        <InviteLayout />
      </ProtectedRoutes>
    ),
    children: [{ index: true, element: <Invites />, errorElement: <ErrorBoundary /> }]
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
      { index: true, element: <Projects />, errorElement: <ErrorBoundary /> },
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
              <AllowedProjectMembers allowed={['dataManager']}>
                <ProjectMembers />
              </AllowedProjectMembers>
            ),
            errorElement: <ErrorBoundary />
          },
          {
            path: 'images',
            element: (
              <AllowedProjectMembers allowed={['dataManager', 'annotator']}>
                <ProjectAnnotate />
              </AllowedProjectMembers>
            ),
            errorElement: <ErrorBoundary />
          },
          {
            path: 'review',
            element: (
              <AllowedProjectMembers allowed={['dataManager', 'reviewer']}>
                <ProjectReview />
              </AllowedProjectMembers>
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
  const [loading, setLoading] = useState(true)
  const setSelectedOrg = useOrgStore((s) => s.setSelectedOrg)
  const setOrgs = useOrgStore((s) => s.setOrgs)
  const setSelectedTagIds = useClassesStore((state) => state.setSelectedTagIds)

  const { data: organizations, isLoading: fetchingOrgs } = useQuery(
    ['organizations', { userId: user?.id! }],
    fetchOrganization,
    { initialData: [], enabled: !!user }
  )

  const initializeAxios = useCallback(async () => {
    setAxiosDefaults()

    const jwtToken = getAuthTokenFromCookie()
    if (jwtToken) {
      setAuthToken(jwtToken)
    } else {
      setLoading(false)
    }

    const userInfo = getUserInfoFromCookie()
    if (userInfo) {
      setUser(userInfo)
    }
  }, [setUser])

  useEffect(() => {
    initializeAxios()
  }, [initializeAxios])

  useEffect(() => {
    setOrgs(organizations)
    setSelectedTagIds([])

    if (organizations.length === 0) {
      setSelectedOrg(null)
      return
    }

    const firstOrgId = organizations[0].id
    setSelectedOrg(firstOrgId)
    setLoading(false)
  }, [organizations, setSelectedOrg, setOrgs, setSelectedTagIds])

  if (loading || fetchingOrgs) return null

  return <RouterProvider router={router} />
}

export default App
