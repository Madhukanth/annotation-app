/**
 * Route Configuration
 * Centralized route definitions and paths
 */

export const ROUTES = {
  // Public routes
  HOME: '',
  LOGIN: 'login',
  SIGNUP: 'signup',

  // Protected routes
  INVITES: 'invites',
  ADMIN: 'admin',

  // Organization routes
  ORG_PROJECTS: 'orgs/:orgid/projects',
  PROJECT_ADD: 'add',
  PROJECT_EDIT: 'edit',
  PROJECT_DASHBOARD: 'dashboard',
  PROJECT_INSTRUCTION: 'instruction',
  PROJECT_MEMBERS: 'members',
  PROJECT_IMAGES: 'images',
  PROJECT_REVIEW: 'review',
  PROJECT_CLASSES: 'classes',
  PROJECT_STATS: 'stats',

  // Annotation routes
  ANNOTATE: 'annotate/orgs/:orgid/projects/:projectid',
  REVIEW: 'review/orgs/:orgid/projects/:projectid',
  CLASSIFY: 'classify/orgs/:orgid/projects/:projectid',
  REVIEW_CLASSIFY: 'review-classify/orgs/:orgid/projects/:projectid',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]

/**
 * Helper to build dynamic route paths
 */
export const buildPath = {
  orgProjects: (orgId: string) => `orgs/${orgId}/projects`,
  projectEdit: (orgId: string, projectId: string) =>
    `orgs/${orgId}/projects/${projectId}/edit`,
  projectDashboard: (orgId: string, projectId: string) =>
    `orgs/${orgId}/projects/${projectId}/dashboard`,
  projectMembers: (orgId: string, projectId: string) =>
    `orgs/${orgId}/projects/${projectId}/members`,
  projectImages: (orgId: string, projectId: string) =>
    `orgs/${orgId}/projects/${projectId}/images`,
  projectReview: (orgId: string, projectId: string) =>
    `orgs/${orgId}/projects/${projectId}/review`,
  projectClasses: (orgId: string, projectId: string) =>
    `orgs/${orgId}/projects/${projectId}/classes`,
  projectStats: (orgId: string, projectId: string) =>
    `orgs/${orgId}/projects/${projectId}/stats`,
  annotate: (orgId: string, projectId: string) =>
    `annotate/orgs/${orgId}/projects/${projectId}`,
  review: (orgId: string, projectId: string) =>
    `review/orgs/${orgId}/projects/${projectId}`,
  classify: (orgId: string, projectId: string) =>
    `classify/orgs/${orgId}/projects/${projectId}`,
  reviewClassify: (orgId: string, projectId: string) =>
    `review-classify/orgs/${orgId}/projects/${projectId}`,
}
