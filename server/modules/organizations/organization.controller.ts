import { Request, Response, NextFunction } from 'express'
import httpStatus from 'http-status'

import * as OrganizationValidation from './organization.validation'
import * as OrganizationService from './organization.service'

export const createOrganizationController = async (
  req: Request<{}, {}, OrganizationValidation.CreateOrganizationBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, orgadmin } = req.body
    const orgDoc = await OrganizationService.dbCreateOrganization(
      name,
      orgadmin
    )
    return res.status(httpStatus.CREATED).json(orgDoc.toJSON())
  } catch (err) {
    next(err)
  }
}

export const gerOrganizationController = async (
  req: Request<{}, {}, {}, OrganizationValidation.GetOrganizationQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userid: userId } = req.query
    const orgDocs = await OrganizationService.dbGetOrganizations(userId)
    const orgs = orgDocs.map((orgDoc) => orgDoc.toJSON())
    return res.status(httpStatus.OK).json(orgs)
  } catch (err) {
    next(err)
  }
}
