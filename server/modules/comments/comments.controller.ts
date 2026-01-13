import { NextFunction, Request, Response } from 'express'
import httpStatus from 'http-status'

import * as CommentValidation from './comments.validation'
import * as CommentService from './comments.service'
import { getObjectId } from '../../utils/db'

export const getCommentsController = async (
  req: Request<
    CommentValidation.HasOrgIdProjectIdAndFileIdParams,
    {},
    {},
    CommentValidation.GetCommentQuery
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orgid: orgId, projectid: projectId, fileid: fileId } = req.params
    const { shapeId } = req.query

    const commentList = await CommentService.dbListComments(
      orgId,
      projectId,
      fileId,
      shapeId
    )
    return res.status(httpStatus.OK).json(commentList)
  } catch (err) {
    next(err)
  }
}

export const createCommentController = async (
  req: Request<
    CommentValidation.HasOrgIdProjectIdAndFileIdParams,
    {},
    CommentValidation.CreateCommentBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new Error('User not found')
    }

    const { orgid: orgId, projectid: projectId, fileid: fileId } = req.params
    const { content, shapeId } = req.body

    const commentDoc = await CommentService.dbCreateComment({
      orgId,
      projectId,
      fileId,
      userId: req.user.id,
      content,
      shapeId,
    })
    return res.status(httpStatus.CREATED).json(commentDoc)
  } catch (err) {
    next(err)
  }
}

export const updateCommentController = async (
  req: Request<
    CommentValidation.HasOrgIdProjectIdFileIdAndCommentIdZod,
    {},
    CommentValidation.UpdateCommentBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { commentid: commentId } = req.params
    const { content } = req.body
    const commentDoc = await CommentService.dbUpdateComment(commentId, {
      content,
    })
    if (!commentDoc) {
      throw new Error('Comment is not found')
    }

    return res.status(httpStatus.OK).json(commentDoc)
  } catch (err) {
    next(err)
  }
}

export const deleteCommentController = async (
  req: Request<CommentValidation.HasOrgIdProjectIdFileIdAndCommentIdZod>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { commentid: commentId } = req.params
    const commentDoc = await CommentService.dbDeleteComment(commentId)
    if (!commentDoc) {
      throw new Error('Comment is not found')
    }

    return res.status(httpStatus.OK).json(commentDoc)
  } catch (err) {
    next(err)
  }
}
