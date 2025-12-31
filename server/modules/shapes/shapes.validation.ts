import { array, number, object, string, TypeOf, enum as zodEnum } from 'zod'

import { shapesAvailable } from './shapes.model'

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

export const hasShapeIdZod = {
  params: hasOrgIdProjectIdAndFileIdZod.params.extend({
    shapeid: string({ required_error: 'shapeid is required' }),
  }),
}
export type HasShapeIdParams = TypeOf<(typeof hasShapeIdZod)['params']>

export const createShapeZod = {
  body: object({
    id: string().optional(),
    type: zodEnum(shapesAvailable, { required_error: 'type is required' }),
    name: string({ required_error: 'name is required' }),
    notes: string().default(''),
    stroke: string().optional(),
    strokeWidth: number().optional(),
    x: number().optional(),
    y: number().optional(),
    height: number().optional(),
    width: number().optional(),
    points: array(
      object({ id: string(), x: number(), y: number() })
    ).optional(),
    classId: string().optional(),
    text: string().optional(),
    ID: string().optional(),
    attribute: string().optional(),
    atFrame: number().default(1),
  }),
}
export type CreateShapeBody = TypeOf<(typeof createShapeZod)['body']>

export const updateShapeZod = {
  body: object({
    type: zodEnum(shapesAvailable).optional(),
    name: string().optional(),
    notes: string().optional(),
    stroke: string().optional(),
    strokeWidth: number().optional(),
    x: number().optional(),
    y: number().optional(),
    height: number().optional(),
    width: number().optional(),
    points: array(
      object({ id: string(), x: number(), y: number() })
    ).optional(),
    classId: string().optional(),
    text: string().optional(),
    ID: string().optional(),
    attribute: string().optional(),
  }),
}
export type UpdateShapeBody = TypeOf<(typeof updateShapeZod)['body']>
