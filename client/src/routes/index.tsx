/**
 * Router Index
 * Main router configuration and exports
 */

import { Suspense } from 'react'
import { createBrowserRouter, Navigate, useRouteError } from 'react-router-dom'

// Layouts
import Layout from '@/layouts/Layout'
import InviteLayout from '@/layouts/InviteLayout'

// Pages
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Projects from '@/pages/Projects'
import AddProject from '@/pages/AddProject'
import Invites from '@/pages/Invites'
import EditProject from '@/pages/EditProject'
import AnnotatePage from '@/pages/AnnotatePage'
import ClassifyPage from '@/pages/ClassifyPage'
import AdminPage from '@/pages/AdminPage'
import ProjectDashboard from '@/pages/ProjectDashboard'
import ProjectMembers from '@/pages/ProjectMembers'
import ProjectStats from '@/pages/ProjectStats'
import Classes from '@/pages/Classes/Classes'

// Components
import ProjectInstructions from '@/components/ProjectView/ProjectInstructions/ProjectInstructions'
import ProjectAnnotate from '@/components/ProjectView/ProjectAnnotate/ProjectAnnotate'
import ProjectReview from '@/components/ProjectView/ProjectReview/ProjectReview'
import AllowedProjectMembers from '@/components/AllowedProjectMember'
import Loader from '@/components/ui/Loader'

// Guards
import { AuthGuard, AdminGuard } from './guards'

/**
 * Error Boundary Component
 */
function ErrorBoundary() {
  const error = useRouteError()
  console.error(error)
  return <Navigate to="" />
}

/**
 * Application Router
 */
export const router = createBrowserRouter([
  // Public routes
  { path: '', element: <Home />, errorElement: <ErrorBoundary /> },
  { path: 'login', element: <Login />, errorElement: <ErrorBoundary /> },
  { path: 'signup', element: <Signup />, errorElement: <ErrorBoundary /> },

  // Invites (protected)
  {
    path: 'invites',
    element: (
      <AuthGuard>
        <InviteLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Invites />, errorElement: <ErrorBoundary /> }
    ]
  },

  // Admin (admin only)
  {
    path: 'admin',
    element: (
      <AdminGuard>
        <InviteLayout />
      </AdminGuard>
    ),
    children: [
      { index: true, element: <AdminPage />, errorElement: <ErrorBoundary /> }
    ]
  },

  // Organization Projects (protected)
  {
    path: 'orgs/:orgid/projects',
    element: (
      <AuthGuard>
        <Layout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Projects />, errorElement: <ErrorBoundary /> },
      {
        path: ':projectid',
        children: [
          { path: 'edit', element: <EditProject />, errorElement: <ErrorBoundary /> },
          { path: 'dashboard', element: <ProjectDashboard />, errorElement: <ErrorBoundary /> },
          { path: 'instruction', element: <ProjectInstructions />, errorElement: <ErrorBoundary /> },
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
      { path: 'add', element: <AddProject />, errorElement: <ErrorBoundary /> }
    ]
  },

  // Organization Invites (protected)
  {
    path: 'orgs/:orgid/invites',
    element: (
      <AuthGuard>
        <Layout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Invites />, errorElement: <ErrorBoundary /> }
    ]
  },

  // Annotation routes (protected with Suspense)
  {
    path: 'annotate/orgs/:orgid/projects/:projectid',
    element: (
      <AuthGuard>
        <Suspense fallback={<Loader />}>
          <AnnotatePage />
        </Suspense>
      </AuthGuard>
    )
  },
  {
    path: 'review/orgs/:orgid/projects/:projectid',
    element: (
      <AuthGuard>
        <Suspense fallback={<Loader />}>
          <AnnotatePage />
        </Suspense>
      </AuthGuard>
    )
  },
  {
    path: 'classify/orgs/:orgid/projects/:projectid',
    element: (
      <AuthGuard>
        <Suspense fallback={<Loader />}>
          <ClassifyPage />
        </Suspense>
      </AuthGuard>
    )
  },
  {
    path: 'review-classify/orgs/:orgid/projects/:projectid',
    element: (
      <AuthGuard>
        <Suspense fallback={<Loader />}>
          <ClassifyPage />
        </Suspense>
      </AuthGuard>
    )
  }
])

// Re-exports
export { ROUTES, buildPath } from './routes.config'
export { 
  ProtectedRoutes,
  OnlyAdminRoutes,
  AllowedProjectMembers,
  AuthGuard, 
  AdminGuard 
} from './guards'
