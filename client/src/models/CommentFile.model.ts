import { Storage } from './Project.model'

const commentFleTypes = ['image', 'video'] as const
export type CommentFileTypesType = (typeof commentFleTypes)[number]

export type CommentFile = {
  id: string
  name: string
  originalName: string
  orgId: string
  projectId: string
  fileId: string
  commentId: string
  relativeUrl: string
  type: CommentFileTypesType
  createdAt: string
  url: string
  storedIn: Storage
}
