import { Request, Response, NextFunction } from 'express'

import * as ActionValidation from './action.validation'
import * as ActionService from './action.service'
import httpStatus from 'http-status'

export const createActionController = async (
  req: Request<
    ActionValidation.HasOrgIdProjectIdAndFileIdParams,
    {},
    ActionValidation.CreateActionBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new Error('User not found')
    }

    const { orgid: orgId, projectid: projectId, fileid: fileId } = req.params
    const { name } = req.body

    const actionDoc = await ActionService.dbCreateAction({
      name,
      orgId,
      projectId,
      fileId,
      userId: req.user.id,
    })
    return res.status(httpStatus.CREATED).json(actionDoc)
  } catch (err) {
    next(err)
  }
}
