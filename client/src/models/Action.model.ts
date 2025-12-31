export const actionNames = [
  'viewed',
  'annotated',
  'skipped',
  'mark_complete',
  'mark_incomplete',
  'classified'
] as const
export type ActionNameType = (typeof actionNames)[number]

export type ActionType = {
  id: string
  name: ActionNameType
  userId: string
  fileId: string
  projectId: string
  orgId: string
  createdAt: string
  modifiedAt: string
}
