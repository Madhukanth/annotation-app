import { object, string, TypeOf, enum as zodEnum } from 'zod'

import { userRoles } from './user.model'

export const getUsersZod = {
  query: object({ email: string().optional(), orgId: string().optional() }),
}
export type GetUsersQuery = TypeOf<(typeof getUsersZod)['query']>

export const getUserZod = {
  params: object({ userid: string({ required_error: 'userid is required' }) }),
}
export type GetUserParams = TypeOf<(typeof getUserZod)['params']>

export const updateUserZod = {
  body: object({
    name: string().optional(),
    email: string().email('Must be a valid email').optional(),
    password: string({ required_error: 'password is required' })
      .min(6, 'password must be at least 6 characters long')
      .max(64, 'password should not be longer than 64 characters')
      .optional(),
    role: zodEnum(userRoles, { required_error: 'role is required' }).optional(),
    orgId: string({ required_error: 'orgId is required' }).optional(),
  }),
}
export type UpdateUserBody = TypeOf<(typeof updateUserZod)['body']>
