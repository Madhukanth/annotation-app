/**
 * Action Types
 * User action/activity tracking definitions
 */

export const actionNames = [
  'viewed',
  'annotated',
  'skipped',
  'mark_complete',
  'mark_incomplete',
  'classified',
] as const

export type ActionName = (typeof actionNames)[number]

export interface Action {
  id: string
  name: ActionName
  userId: string
  fileId: string
  projectId: string
  orgId: string
  createdAt: string
  modifiedAt: string
}
