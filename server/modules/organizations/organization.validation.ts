import { object, string, TypeOf } from 'zod'

export const createOrganizationZod = {
  body: object({
    name: string({ required_error: 'name is required' }),
    orgadmin: string({ required_error: 'orgadmin is required' }),
  }),
}
export type CreateOrganizationBody = TypeOf<
  (typeof createOrganizationZod)['body']
>

export const getOrganizationsZod = {
  query: object({ userid: string().optional() }),
}
export type GetOrganizationQuery = TypeOf<(typeof getOrganizationsZod)['query']>
