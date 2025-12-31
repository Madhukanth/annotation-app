import express from 'express'
import {
  processRequestBody,
  processRequestParams,
  processRequestQuery,
} from 'zod-express-middleware'

import { authorize } from '../../middlewares/auth'
import * as OrganizationValidation from './organization.validation'
import * as OrganizationController from './organization.controller'
import * as ProjectValidation from '../projects/project.validation'
import * as ProjectController from '../projects/project.controller'

export default () => {
  const api = express.Router()

  // Get organizations
  api.get(
    '/',
    authorize,
    processRequestQuery(OrganizationValidation.getOrganizationsZod.query),
    OrganizationController.gerOrganizationController
  )

  // Create organization
  api.post(
    '/',
    authorize,
    processRequestBody(OrganizationValidation.createOrganizationZod.body),
    OrganizationController.createOrganizationController
  )

  return api
}
