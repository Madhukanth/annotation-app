import express from 'express'

import * as UserController from './user.controller'
import * as UserValidation from './user.validation'
import { authorize } from '../../middlewares/auth'
import {
  processRequestBody,
  processRequestParams,
  processRequestQuery,
} from 'zod-express-middleware'

export default () => {
  const api = express.Router()

  // Get users
  api.get(
    '/',
    authorize,
    processRequestQuery(UserValidation.getUsersZod.query),
    UserController.getUsersController
  )

  // Get user by id
  api.get(
    '/:userid',
    authorize,
    processRequestParams(UserValidation.getUserZod.params),
    UserController.getUserController
  )

  api.get(
    '/:userid/invites',
    authorize,
    processRequestParams(UserValidation.getUserZod.params),
    UserController.getUserInvites
  )

  // Update user
  api.patch(
    '/:userid',
    authorize,
    processRequestBody(UserValidation.updateUserZod.body),
    UserController.updateUserController
  )

  // Delete user
  api.delete('/:userid', authorize, UserController.deleteUserController)

  return api
}
