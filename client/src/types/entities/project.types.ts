/**
 * Project Types
 * Project-related entity definitions
 */

export type StorageType = 'aws' | 'azure' | 'default'
export type TaskType = 'classification' | 'object-annotation'

export interface Project {
  id: string
  name: string
  orgId: string
  dataManagers: string[]
  reviewers: string[]
  annotators: string[]
  instructions: string
  createdAt: string
  modifiedAt: string
  thumbnail: string
  storage: StorageType
  taskType: TaskType
  defaultClassId: string | null
  isSyncing: boolean
  syncedAt: Date
}
