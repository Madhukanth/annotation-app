import { getObjectId } from '../../utils/db'
import CommentModel, { CommentType } from './comments.model'

export const dbListComments = async (
  orgId: string,
  projectId: string,
  fileId: string,
  shapeId?: string
) => {
  const queryParams: { [key: string]: string } = {}
  if (shapeId) {
    queryParams['shapeId'] = shapeId
  }

  const commentDocs = await CommentModel.find({
    orgId: getObjectId(orgId),
    projectId: getObjectId(projectId),
    fileId: getObjectId(fileId),
    ...queryParams,
  })
    .populate({ path: 'userId', select: { name: 1, email: 1, role: 1 } })
    .sort({ createdAt: 'desc' })
  return commentDocs
}

export const dbCreateComment = async (
  newComment: Omit<Omit<CommentType, 'id'>, '_id'>
) => {
  const commentDoc = await CommentModel.create({ ...newComment })
  return commentDoc
}

export const dbUpdateComment = async (
  commentId: string,
  updatedComment: Partial<CommentType>
) => {
  const commentDoc = await CommentModel.findOneAndUpdate(
    { _id: getObjectId(commentId) },
    { ...updatedComment }
  )
  return commentDoc
}

export const dbDeleteComment = async (commentId: string) => {
  const commentDoc = await CommentModel.findOne({
    _id: getObjectId(commentId),
  })
  if (!commentDoc) return null

  await commentDoc.deleteOne()
  return commentDoc
}
