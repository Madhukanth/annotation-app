import express from 'express'
import {
  processRequestBody,
  processRequestParams,
} from 'zod-express-middleware'

import * as CommentsValidation from './comments.validation'
import * as CommentsController from './comments.controller'
import { authorize } from '../../middlewares/auth'

export default () => {
  const api = express.Router({ mergeParams: true })

  // Get comments
  api.get('/', authorize, CommentsController.getCommentsController)

  // Create comment
  api.post(
    '/',
    authorize,
    processRequestBody(CommentsValidation.createCommentZod.body),
    CommentsController.createCommentController
  )

  // Update comment
  api.patch(
    '/:commentid',
    authorize,
    processRequestParams(
      CommentsValidation.hasOrgIdProjectIdFileIdAndCommentIdZod.params
    ),
    processRequestBody(CommentsValidation.updateCommentZod.body),
    CommentsController.updateCommentController
  )

  // Delete comment
  api.delete(
    '/:commentid',
    authorize,
    processRequestParams(
      CommentsValidation.hasOrgIdProjectIdFileIdAndCommentIdZod.params
    ),
    CommentsController.deleteCommentController
  )

  return api
}
