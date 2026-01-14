/**
 * Comment Types
 * Comment entity definitions
 */

import { StorageType } from './project.types'

// Comment file types
export const commentFileTypes = ['image', 'video'] as const
export type CommentFileType = (typeof commentFileTypes)[number]

// User reference in comments (simplified)
export interface CommentUser {
  id: string
  name: string
  email?: string
}

// Comment entity
export interface Comment {
  id: string
  userId: CommentUser
  fileId: string
  projectId: string
  orgId: string
  content: string
  createdAt: string
}

// Comment attachment file
export interface CommentFile {
  id: string
  name: string
  originalName: string
  orgId: string
  projectId: string
  fileId: string
  commentId: string
  relativeUrl: string
  type: CommentFileType
  createdAt: string
  url: string
  storedIn: StorageType
}
