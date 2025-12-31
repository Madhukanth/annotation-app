import express from 'express'
import {
  processRequestBody,
  processRequestParams,
} from 'zod-express-middleware'

import { authorize } from '../../middlewares/auth'
import * as FileValidation from './file.validation'
import * as FileController from './file.controller'

export default () => {
  const api = express.Router({ mergeParams: true })

  // Get the file upload url
  api.post(
    '/upload-url',
    authorize,
    processRequestBody(FileValidation.createUploadUrlZod.body),
    FileController.createFileUrlController
  )

  api.patch(
    '/associate',
    authorize,
    processRequestBody(FileValidation.associateTagIdsToFileZod.body),
    FileController.associateTagIdsToFileController
  )

  api.patch(
    '/associate-tags',
    authorize,
    processRequestBody(FileValidation.associateTagIdsToFilesZod.body),
    FileController.associateTagsToFilesController
  )

  api.post(
    '/add',
    authorize,
    processRequestBody(FileValidation.addAzureFilesZod.body),
    FileController.addAzureFilesController
  )

  // Export data
  api.get('/export', authorize, FileController.exportShapesController)

  // Delete file by id
  api.delete(
    '/:fileid',
    authorize,
    processRequestParams(FileValidation.hasOrgIdProjectIdAndFileIdZod.params),
    FileController.deleteFileController
  )

  // Save annotation
  api.patch(
    '/:fileid',
    authorize,
    processRequestParams(FileValidation.hasOrgIdProjectIdAndFileIdZod.params),
    FileController.updateFileController
  )

  // Upload file to server
  api.put(
    '/:fileid/upload',
    authorize,
    processRequestParams(FileValidation.hasOrgIdProjectIdAndFileIdZod.params),
    FileController.uploadFileController
  )

  // Complete the upload
  api.post(
    '/:fileid/complete',
    authorize,
    processRequestParams(FileValidation.hasOrgIdProjectIdAndFileIdZod.params),
    processRequestBody(FileValidation.completeUploadZod.body),
    FileController.completeUploadController
  )

  api.post(
    '/:fileid/videos',
    authorize,
    processRequestParams(FileValidation.hasOrgIdProjectIdAndFileIdZod.params),
    FileController.uploadVideoFileController
  )

  return api
}
