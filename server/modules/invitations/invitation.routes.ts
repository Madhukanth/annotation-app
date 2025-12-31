import express from 'express'
import {
  processRequestBody,
  processRequestParams,
  processRequestQuery,
} from 'zod-express-middleware'

import * as InviteController from './invitation.controller'
import * as InviteValidation from './invitation.validation'
import { authorize } from '../../middlewares/auth'

export default () => {
  const api = express.Router({ mergeParams: true })

  // Get Invites
  api.get(
    '/',
    authorize,
    processRequestQuery(InviteValidation.getInvitesZod.query),
    InviteController.getInvitesController
  )

  // Create Invitation
  api.post(
    '/',
    authorize,
    processRequestBody(InviteValidation.createInvitationZod.body),
    InviteController.createInvitationController
  )

  // Delete Invitation
  api.delete(
    '/:inviteid',
    authorize,
    processRequestParams(InviteValidation.deleteInvitationZod.params),
    InviteController.deleteInvitationController
  )

  // Update invite status
  api.patch(
    '/:inviteid',
    authorize,
    processRequestParams(InviteValidation.updateInvitationStatusZod.params),
    processRequestBody(InviteValidation.updateInvitationStatusZod.body),
    InviteController.updateInvitationStatusController
  )

  return api
}
