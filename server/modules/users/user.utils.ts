import { omit, pick } from 'lodash'
import httpStatus from 'http-status'

import { UserType } from './user.service'
import APIError from '../../errors/api-error'

export type UserSafeInfoType = ReturnType<typeof getUserSafeInfo>

export const getUserSafeInfo = (user: UserType) => {
  return pick(user, ['id', 'name', 'email', 'role'])
}

export const checkDuplicateEmail = (error: Error) => {
  // @ts-ignore
  if (error.name !== 'MongoError' || error.code !== 11000) return error

  return new APIError(
    'Validation Error',
    httpStatus.CONFLICT,
    error.stack,
    [
      {
        field: 'email',
        location: 'body',
        messages: ['"email" already exists'],
      },
    ],
    true
  )
}

export const omitPassword = (user: UserType) => {
  return user // User from Supabase doesn't include password field
}
