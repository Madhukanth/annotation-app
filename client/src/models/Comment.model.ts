import { UserType } from '@renderer/store/user.store'

type CommentType = {
  id: string
  userId: UserType
  fileId: string
  projectId: string
  orgId: string
  content: string
  createdAt: string
}

export default CommentType
