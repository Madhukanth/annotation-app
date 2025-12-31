import express from 'express'
import { processRequestBody } from 'zod-express-middleware'

import * as ActionValidation from './action.validation'
import * as ActionController from './action.controller'
import { authorize } from '../../middlewares/auth'

export default () => {
  const api = express.Router({ mergeParams: true })

  // Create Action
  api.post(
    '/',
    authorize,
    processRequestBody(ActionValidation.createActionZod.body),
    ActionController.createActionController
  )

  return api
}
