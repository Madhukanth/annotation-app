import { object, string, TypeOf } from 'zod'

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

export const hasOrgIdProjectIdFileIdAndCommentIdZod = {
  params: hasOrgIdProjectIdAndFileIdZod.params.extend({
    commentid: string({ required_error: 'commentid is required' }),
  }),
}
export type HasOrgIdProjectIdFileIdAndCommentIdZod = TypeOf<
  (typeof hasOrgIdProjectIdFileIdAndCommentIdZod)['params']
>

export const getCommentsZod = {
  params: hasOrgIdProjectIdAndFileIdZod.params,
  query: object({ shapeId: string().optional() }),
}
export type GetCommentQuery = TypeOf<(typeof getCommentsZod)['query']>

export const createCommentZod = {
  body: object({
    content: string({ required_error: 'content is required' }),
    shapeId: string().optional(),
  }),
}
export type CreateCommentBody = TypeOf<(typeof createCommentZod)['body']>

export const updateCommentZod = {
  body: object({ content: string({ required_error: 'content is required' }) }),
}
export type UpdateCommentBody = TypeOf<(typeof updateCommentZod)['body']>
