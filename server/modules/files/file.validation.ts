import {
  any,
  array,
  boolean,
  number,
  object,
  record,
  string,
  TypeOf,
  enum as zodEnum,
} from 'zod'
import { fileTypes } from './file.model'

export const hasOrgIdAndProjectIdZod = {
  params: object({
    orgid: string({ required_error: 'orgid is required' }),
    projectid: string({ required_error: 'projectid is required' }),
  }),
}
export type HasOrgIdAndProjectIdParams = TypeOf<
  (typeof hasOrgIdAndProjectIdZod)['params']
>

export const hasOrgIdProjectIdAndFileIdZod = {
  params: hasOrgIdAndProjectIdZod.params.extend({
    fileid: string({ required_error: 'fileid is required' }),
  }),
}
export type HasOrgIdProjectIdAndFileIdParams = TypeOf<
  (typeof hasOrgIdProjectIdAndFileIdZod)['params']
>

export const createUploadUrlZod = {
  body: object({
    originalName: string({ required_error: 'originalName is required' }),
    type: string({ required_error: 'type is required' }),
  }),
}
export type CreateUploadUrlBody = TypeOf<(typeof createUploadUrlZod)['body']>

export const completeUploadZod = {
  body: object({
    originalName: string(),
    name: string(),
    relativePath: string(),
    totalFrames: number().default(1),
    fps: number().default(1),
    duration: number().default(0),
    type: zodEnum(fileTypes, { required_error: 'type is required' }),
  }),
}
export type CompleteUploadBody = TypeOf<(typeof completeUploadZod)['body']>

export const associateTagIdsToFileZod = {
  body: record(array(string())),
}
export type AssociateTagIdsToFileBody = TypeOf<
  (typeof associateTagIdsToFileZod)['body']
>

export const exportShapesZod = {
  query: object({
    skip: number().default(0),
    limit: number().default(1000),
    annotatedAfter: any().optional(),
  }),
}
export type ExportShapesQuery = TypeOf<(typeof exportShapesZod)['query']>

export const addAzureFilesZod = {
  body: object({
    blobNames: string().array(),
  }),
}
export type AddAzureFilesBody = TypeOf<(typeof addAzureFilesZod)['body']>

export const associateTagIdsToFilesZod = {
  body: object({
    tagIds: string().array(),
    fileIds: string().array(),
  }),
}
export type AssociateTagIdsToFilesBody = TypeOf<
  (typeof associateTagIdsToFilesZod)['body']
>
