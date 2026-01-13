import { NextFunction, Request, Response } from 'express'

import * as ProjectService from '../projects/project.service'
import * as InviteValidation from './invitation.validation'
import * as InviteService from './invitation.service'
import httpStatus from 'http-status'
import APIError from '../../errors/api-error'

export const createInvitationController = async (
  req: Request<
    InviteValidation.HasOrgIdAndProjectIdParams,
    {},
    InviteValidation.CreateInvitationBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { projectid: projectId } = req.params
    const { inviter, invitees, role } = req.body

    const inviteList = []
    for (const invitee of invitees) {
      const inviteDoc = await InviteService.dbCreateInvitation(
        projectId,
        inviter,
        invitee,
        role
      )
      inviteList.push(inviteDoc)
    }
    return res.status(httpStatus.CREATED).json(inviteList)
  } catch (err) {
    next(err)
  }
}

export const deleteInvitationController = async (
  req: Request<
    InviteValidation.DeleteInvitationParams,
    {},
    InviteValidation.DeleteInvitationParams
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { inviteid: inviteId } = req.params
    const deletedDoc = await InviteService.dbDeleteInvitation(inviteId)
    if (!deletedDoc) {
      throw new APIError('Invitation not found', httpStatus.NOT_FOUND)
    }

    return res.status(httpStatus.OK).json(deletedDoc)
  } catch (err) {
    next(err)
  }
}

export const updateInvitationStatusController = async (
  req: Request<
    InviteValidation.UpdateInvitationStatusParams,
    {},
    InviteValidation.UpdateInvitationStatusBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      inviteid: inviteId,
      projectid: projectId,
    } = req.params
    const { status } = req.body

    if (status === 'accepted') {
      const inviteDoc = await InviteService.dbGetInviteById(inviteId)
      if (!inviteDoc) {
        throw new APIError('Invitation not found', httpStatus.NOT_FOUND)
      }

      // Add user to appropriate project role (this implicitly makes them org members)
      if (inviteDoc.role === 'datamanager') {
        await ProjectService.dbAddDataManagerToProject(
          projectId,
          inviteDoc.invitee_id
        )
      }

      if (inviteDoc.role === 'reviewer') {
        await ProjectService.dbAddReviewerToProject(
          projectId,
          inviteDoc.invitee_id
        )
      }

      if (inviteDoc.role === 'annotator') {
        await ProjectService.dbAddAnnotatorToProject(
          projectId,
          inviteDoc.invitee_id
        )
      }
    }

    const updatedDoc = await InviteService.dbUpdateInviteStatus(
      inviteId,
      status
    )

    if (!updatedDoc) {
      throw new APIError('Invitation not found', httpStatus.NOT_FOUND)
    }

    return res.status(httpStatus.OK).json(updatedDoc)
  } catch (err) {
    console.log(err)
    next(err)
  }
}

export const getInvitesController = async (
  req: Request<
    InviteValidation.HasOrgIdAndProjectIdParams,
    {},
    {},
    InviteValidation.GetInivitesQuery
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, inviterid, inviteeid, projectid } = req.query
    const inviteDocs = await InviteService.dbGetInvites({
      projectId: projectid,
      inviterId: inviterid,
      inviteeId: inviteeid,
      status,
    })
    return res.status(httpStatus.OK).json(inviteDocs)
  } catch (err) {
    next(err)
  }
}
