import express from 'express'
import {
  processRequestBody,
  processRequestParams,
} from 'zod-express-middleware'

import { authorize } from '../../middlewares/auth'
import * as CommentFilesValidation from './commentfiles.validation'
import * as CommentFilesController from './commentfiles.controller'

export default () => {
  const api = express.Router({ mergeParams: true })

  // Get comment files by commentId
  api.get('/', authorize, CommentFilesController.getCommentFileController)

  // Get the file upload url
  api.post(
    '/upload-url',
    authorize,
    processRequestBody(CommentFilesValidation.createCommentFileUrlZod.body),
    CommentFilesController.createCommentFileUrl
  )

  // Upload file to server
  api.put(
    '/:commentfileid/upload',
    authorize,
    processRequestParams(
      CommentFilesValidation.hasOrgIdProjectIdFileIdCommentIdAndCommentFileIdZod
        .params
    ),
    CommentFilesController.uploadCommentFileController
  )

  // Complete the upload
  api.post(
    '/:commentfileid/complete',
    authorize,
    processRequestParams(
      CommentFilesValidation.hasOrgIdProjectIdFileIdCommentIdAndCommentFileIdZod
        .params
    ),
    processRequestBody(CommentFilesValidation.completeUploadZod.body),
    CommentFilesController.completeUploadController
  )

  return api
}
