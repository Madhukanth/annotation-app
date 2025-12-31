import { array, boolean, object, string, TypeOf } from 'zod'

export const hasOrgIdAndProjectIdZod = {
  params: object({
    orgid: string({ required_error: 'orgid is required' }),
    projectid: string({ required_error: 'projectid is required' }),
  }),
}
export type HasOrgIdAndProjectIdParams = TypeOf<
  (typeof hasOrgIdAndProjectIdZod)['params']
>

export const getAnnotationClassesZod = {
  query: object({
    name: string().optional(),
    skip: string()
      .optional()
      .default('0')
      .transform((v) => Number(v)),
    limit: string()
      .optional()
      .default('20')
      .transform((v) => Number(v)),
  }),
}
export type GetAnnotationClassesQuery = TypeOf<
  (typeof getAnnotationClassesZod)['query']
>

export const hasClassIdZod = {
  params: object({
    classid: string({ required_error: 'classid is required' }),
  }),
}
export type HasClassIdParams = TypeOf<(typeof hasClassIdZod)['params']>

export const createAnnotationClassZod = {
  body: object({
    name: string({ required_error: 'name is required' }),
    attributes: array(string()).default([]),
    text: boolean().default(false),
    ID: boolean().default(false),
    color: string({ required_error: 'color is required' }),
    notes: string().default(''),
  }),
}
export type CreateAnnotationClassBody = TypeOf<
  (typeof createAnnotationClassZod)['body']
>

export const updateAnnotationClassZod = {
  params: hasOrgIdAndProjectIdZod.params.extend({
    classid: string({ required_error: 'classid is required' }),
  }),
  body: object({
    name: string({ required_error: 'name is required' }),
    attributes: array(string()).default([]),
    text: boolean().default(false),
    ID: boolean().default(false),
    color: string({ required_error: 'color is required' }),
    notes: string().default(''),
  }),
}
export type UpdateAnnotationClassParams = TypeOf<
  (typeof updateAnnotationClassZod)['params']
>
export type UpdateAnnotationClassBody = TypeOf<
  (typeof updateAnnotationClassZod)['body']
>
