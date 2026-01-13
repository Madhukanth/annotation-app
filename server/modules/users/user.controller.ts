import { Request, Response, NextFunction } from 'express'
import httpStatus from 'http-status'

import * as UserValidation from './user.validation'
import * as UserService from './user.service'
import * as InviteService from '../invitations/invitation.service'

import APIError from '../../errors/api-error'
import { omitPassword } from './user.utils'

export const getUsersController = async (
  req: Request<{}, {}, {}, UserValidation.GetUsersQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, orgId } = req.query
    if (orgId) {
      const users = await UserService.dbFindUsersByOrgId(orgId)
      return res.status(httpStatus.OK).json(users)
    }

    const userDocs = await UserService.dbSearchUsersBy(email)
    return res.status(httpStatus.OK).json(userDocs)
  } catch (err) {
    next(err)
  }
}

export const getUserController = async (
  req: Request<UserValidation.GetUserParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userid } = req.params
    const userDoc = await UserService.dbFindUserById(userid)
    if (!userDoc) {
      throw new APIError('User not found', httpStatus.NOT_FOUND)
    }

    return res.status(httpStatus.OK).json(omitPassword(userDoc))
  } catch (err) {
    next(err)
  }
}

export const getUserInvites = async (
  req: Request<UserValidation.GetUserParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userid: userId } = req.params
    const inviteDocs = await InviteService.dbGetInvites({
      inviteeId: userId,
      status: 'pending',
    })
    return res.status(httpStatus.OK).json(inviteDocs)
  } catch (err) {
    next(err)
  }
}

export const updateUserController = async (
  req: Request<UserValidation.GetUserParams, {}, UserValidation.UpdateUserBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userid } = req.params
    const userDoc = await UserService.dbUpdateUserById(userid, req.body)
    if (!userDoc) {
      throw new APIError(
        `User with id ${userid} not found`,
        httpStatus.NOT_FOUND
      )
    }

    return res.status(httpStatus.OK).json(omitPassword(userDoc))
  } catch (err) {
    next(err)
  }
}

export const deleteUserController = async (
  req: Request<UserValidation.GetUserParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userid } = req.params
    const userDoc = await UserService.dbDeleteUserById(userid)
    if (!userDoc) {
      throw new APIError(
        `User with id ${userid} not found`,
        httpStatus.NOT_FOUND
      )
    }

    return res.status(httpStatus.NO_CONTENT).send()
  } catch (err) {
    next(err)
  }
}
