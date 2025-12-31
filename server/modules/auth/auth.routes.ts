import express from 'express'
import { processRequestBody } from 'zod-express-middleware'

import * as AuthValidation from './auth.validation'
import * as AuthController from './auth.controller'

export default () => {
  const api = express.Router()

  // Register user
  api.post(
    '/signup',
    processRequestBody(AuthValidation.registerUserZod.body),
    AuthController.registerUserController
  )

  // Login user
  api.post(
    '/login',
    processRequestBody(AuthValidation.loginUserZod.body),
    AuthController.loginUserController
  )

  return api
}
