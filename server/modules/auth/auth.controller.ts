import { NextFunction, Request, Response } from 'express'
import httpStatus from 'http-status'

import * as AuthUtils from './auth.utils'
import * as AuthValidations from './auth.validation'
import * as UserServices from '../users/user.service'
import * as UserUtils from '../users/user.utils'
import * as OrganizationServices from '../organizations/organization.service'
import APIError from '../../errors/api-error'
import { getUserSafeInfo } from '../users/user.utils'

export const registerUserController = async (
  req: Request<
    {},
    UserUtils.UserSafeInfoType,
    AuthValidations.RegisterUserBody
  >,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, name, role, orgId } = req.body
    const hashedPassword = await AuthUtils.hashPassword(password)
    const newUser = await UserServices.dbCreateUser(
      {
        name,
        email,
        password: hashedPassword,
        role,
      },
      orgId
    )

    const userSafeInfo = getUserSafeInfo(newUser.toJSON())
    return res.status(httpStatus.CREATED).send(userSafeInfo)
  } catch (err) {
    next(UserUtils.checkDuplicateEmail(err as Error))
  }
}

export const loginUserController = async (
  req: Request<{}, {}, AuthValidations.LoginUserBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body

    const userDoc = await UserServices.dbFindUserByEmail(email)
    if (!userDoc) {
      throw new APIError('user does not exist', httpStatus.NOT_FOUND)
    }

    const userJson = userDoc.toJSON()
    const isMatch = await AuthUtils.comparePassword(password, userJson.password)
    if (!isMatch) {
      throw new APIError(
        'email or password is incorrect',
        httpStatus.UNAUTHORIZED
      )
    }

    const userSafeInfo = getUserSafeInfo(userDoc.toJSON())
    const token = AuthUtils.signJwt(userSafeInfo)
    const orgs = await OrganizationServices.dbGetOrganizations(userSafeInfo.id)
    return res.status(httpStatus.OK).send({ user: userSafeInfo, token, orgs })
  } catch (err) {
    next(err)
  }
}
