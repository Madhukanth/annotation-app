import express from 'express'
import {
  processRequestBody,
  processRequestParams,
} from 'zod-express-middleware'

import * as AnnotationClassController from './annotationclasses.controller'
import * as AnnotationClassValidation from './annotationclasses.validation'
import { authorize } from '../../middlewares/auth'

export default () => {
  const api = express.Router({ mergeParams: true })

  // Create new annotation class
  api.post(
    '/',
    authorize,
    processRequestBody(AnnotationClassValidation.createAnnotationClassZod.body),
    AnnotationClassController.createAnnotationClassController
  )

  // Get list of annotation classes by orgId and projectId
  api.get(
    '/',
    authorize,
    AnnotationClassController.getAnnotationClassesController
  )

  // Update annotation class by classid
  api.patch(
    '/:classid',
    authorize,
    processRequestParams(
      AnnotationClassValidation.updateAnnotationClassZod.params
    ),
    processRequestBody(AnnotationClassValidation.updateAnnotationClassZod.body),
    AnnotationClassController.updateAnnotationClassController
  )

  // Delete annotation class by classid
  api.delete(
    '/:classid',
    authorize,
    processRequestParams(AnnotationClassValidation.hasClassIdZod.params),
    AnnotationClassController.deleteAnnotationClassController
  )

  return api
}
