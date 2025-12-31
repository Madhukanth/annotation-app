import { object, string, TypeOf, enum as zodEnum } from 'zod'

import { userRoles } from '../users/user.model'

export const registerUserZod = {
  body: object({
    name: string({ required_error: 'name is required' }),
    email: string({ required_error: 'email is required' }).email(
      'Must be a valid email'
    ),
    password: string({ required_error: 'password is required' })
      .min(6, 'password must be at least 6 characters long')
      .max(64, 'password should not be longer than 64 characters'),
    role: zodEnum(userRoles, { required_error: 'role is required' }),
    orgId: string({ required_error: 'orgId is required' }),
  }),
}
export type RegisterUserBody = TypeOf<(typeof registerUserZod)['body']>

export const loginUserZod = {
  body: object({
    email: string({ required_error: 'email is required' }).email(
      'Must be a valid email'
    ),
    password: string({ required_error: 'password is required' })
      .min(6, 'password must be at least 6 characters long')
      .max(64, 'password should not be longer than 64 characters'),
  }),
}
export type LoginUserBody = TypeOf<(typeof loginUserZod)['body']>
