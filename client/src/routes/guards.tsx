/**
 * Route Guards
 * Authentication and authorization wrapper components
 */

import { FC, Fragment, ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useUserStore } from '@/store/user.store'
import { useProjectStore } from '@/store/project.store'

interface RouteGuardProps {
  children: ReactNode
}

/**
 * ProtectedRoutes - Protects routes that require authentication
 */
export const ProtectedRoutes: FC<RouteGuardProps> = ({ children }) => {
  const user = useUserStore((s) => s.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Fragment>{children}</Fragment>
}

// Alias for backward compatibility
export const AuthGuard = ProtectedRoutes

/**
 * OnlyAdminRoutes - Protects routes that require admin role
 */
export const OnlyAdminRoutes: FC<RouteGuardProps> = ({ children }) => {
  const user = useUserStore((s) => s.user)

  const allowed = ['superadmin', 'orgadmin']

  if (!user || !allowed.includes(user.role)) {
    return <Navigate to="/" />
  }

  return <Fragment>{children}</Fragment>
}

// Alias for backward compatibility
export const AdminGuard = OnlyAdminRoutes

interface AllowedProjectMembersProps {
  children: ReactNode
  allowed: ('dataManager' | 'reviewer' | 'annotator')[]
}

/**
 * AllowedProjectMembers - Protects routes based on project membership
 */
export const AllowedProjectMembers: FC<AllowedProjectMembersProps> = ({ children, allowed }) => {
  const user = useUserStore((s) => s.user)
  const { projectid: projectId } = useParams()

  const projects = useProjectStore((s) => s.projects)
  const project = projects.find((p) => p.id === projectId)
  
  if (!project || !user) {
    return <Navigate to="/" />
  }

  let show = false
  if (allowed.length === 0) {
    show = true
  } else if (allowed.includes('dataManager') && project.dataManagers.includes(user.id)) {
    show = true
  } else if (allowed.includes('reviewer') && project.reviewers.includes(user.id)) {
    show = true
  } else if (allowed.includes('annotator') && project.annotators.includes(user.id)) {
    show = true
  }

  if (!show) {
    return <Navigate to="/" />
  }

  return <Fragment>{children}</Fragment>
}

// Default exports for backward compatibility
export default ProtectedRoutes
