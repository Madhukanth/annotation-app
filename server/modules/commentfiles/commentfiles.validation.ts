import exp from 'constants'
import { object, string, TypeOf } from 'zod'

export const hasOrgIdProjectIdFileIdAndCommentIdZod = {
  params: object({
    orgid: string({ required_error: 'orgid is required' }),
    projectid: string({ required_error: 'projectid is required' }),
    fileid: string({ required_error: 'fileid is required' }),
    commentid: string({ required_error: 'commentid is required' }),
  }),
}
export type HasOrgIdProjectIdFileIdAndCommentIdParams = TypeOf<
  (typeof hasOrgIdProjectIdFileIdAndCommentIdZod)['params']
>

export const hasOrgIdProjectIdFileIdCommentIdAndCommentFileIdZod = {
  params: object({
    orgid: string({ required_error: 'orgid is required' }),
    projectid: string({ required_error: 'projectid is required' }),
    fileid: string({ required_error: 'fileid is required' }),
    commentid: string({ required_error: 'commentid is required' }),
    commentfileid: string({ required_error: 'commentfileid is required' }),
  }),
}
export type HasOrgIdProjectIdFileIdCommentIdAndCommentFileIdZod = TypeOf<
  (typeof hasOrgIdProjectIdFileIdCommentIdAndCommentFileIdZod)['params']
>

export const createCommentFileUrlZod = {
  body: object({
    originalName: string({ required_error: 'originalName is required' }),
    type: string({ required_error: 'type is required' }),
  }),
}
export type CreateCommentFileUrlBody = TypeOf<
  (typeof createCommentFileUrlZod)['body']
>

export const completeUploadZod = {
  body: object({
    originalName: string(),
    name: string(),
    relativePath: string(),
  }),
}
export type CompleteUploadBody = TypeOf<(typeof completeUploadZod)['body']>
