export type Storage = 'aws' | 'azure' | 'default'
export type Task = 'classification' | 'object-annotation'

type ProjectType = {
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
  storage: Storage
  taskType: Task
  defaultClassId: string | null
  isSyncing: boolean
  syncedAt: Date
}

export default ProjectType
