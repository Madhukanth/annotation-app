import {
  Strategy as JwtStrategy,
  StrategyOptions,
  ExtractJwt,
  VerifyCallback,
} from 'passport-jwt'

import envs from './vars'
import * as UserService from '../modules/users/user.service'
import { getUserSafeInfo } from '../modules/users/user.utils'
import APIError from '../errors/api-error'
import httpStatus from 'http-status'

const jwtOptions: StrategyOptions = {
  secretOrKey: envs.JWT_SECRET,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
}

const jwtCallback: VerifyCallback = async (payload, done) => {
  try {
    if (!payload.id) {
      const error = new APIError('Not authorized', httpStatus.UNAUTHORIZED)
      return done(error, false)
    }

    const userDoc = await UserService.dbFindUserById(payload.id)
    if (!userDoc) {
      const error = new APIError('User not found', httpStatus.UNAUTHORIZED)
      return done(error, false)
    }

    const userSafeInfo = getUserSafeInfo(userDoc.toJSON())
    return done(null, userSafeInfo)
  } catch (error) {
    return done(error, false)
  }
}

export const jwt = new JwtStrategy(jwtOptions, jwtCallback)
