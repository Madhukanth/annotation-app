import { object, string, TypeOf, enum as zodEnum } from 'zod'

import { actionNames } from './action.model'

export const hasOrgIdProjectIdAndFileIdZod = {
  params: object({
    orgid: string({ required_error: 'orgid is required' }),
    projectid: string({ required_error: 'projectid is required' }),
    fileid: string({ required_error: 'fileid is required' }),
  }),
}
export type HasOrgIdProjectIdAndFileIdParams = TypeOf<
  (typeof hasOrgIdProjectIdAndFileIdZod)['params']
>

export const createActionZod = {
  body: object({
    name: zodEnum(actionNames, { required_error: 'action name is required' }),
  }),
}
export type CreateActionBody = TypeOf<(typeof createActionZod)['body']>
