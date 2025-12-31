import express from 'express'

import * as ShapeController from './shapes.controller'
import * as ShapeValidation from './shapes.validation'
import { authorize } from '../../middlewares/auth'
import {
  processRequestBody,
  processRequestParams,
} from 'zod-express-middleware'

export default () => {
  const api = express.Router({ mergeParams: true })

  // Get shapes
  api.get('/', authorize, ShapeController.getShapes)

  // Create shape
  api.post(
    '/',
    authorize,
    processRequestBody(ShapeValidation.createShapeZod.body),
    ShapeController.createShapeController
  )

  // Update shape
  api.patch(
    '/:shapeid',
    authorize,
    processRequestParams(ShapeValidation.hasShapeIdZod.params),
    processRequestBody(ShapeValidation.updateShapeZod.body),
    ShapeController.updateShapeController
  )

  // Delete shape
  api.delete(
    '/:shapeid',
    authorize,
    processRequestParams(ShapeValidation.hasShapeIdZod.params),
    ShapeController.deleteShapeController
  )

  return api
}
