import { getObjectId } from '../../utils/db'
import CommentFileModel, { CommentFile } from './commentfiles.model'

export const dbGetCommentFiles = async (commentId: string) => {
  const commentFileDocs = await CommentFileModel.find({
    commentId: getObjectId(commentId),
  })
  return commentFileDocs
}

export const dbCreateCommentFile = async (
  newCommentFile: Omit<CommentFile, 'id'>
) => {
  const commentFileDoc = await CommentFileModel.create({ ...newCommentFile })
  return commentFileDoc
}
