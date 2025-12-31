import { object, string, TypeOf, enum as zodEnum } from 'zod'
import { storageValues, taskValues } from './project.model'
import { inviteRoles } from '../invitations/invitation.model'

export const hasOrgIdZod = {
  params: object({ orgid: string({ required_error: 'orgid is required' }) }),
}
export type HasOrgIdParams = TypeOf<(typeof hasOrgIdZod)['params']>

export const hasProjectIdZod = {
  params: hasOrgIdZod.params.extend({
    projectid: string({ required_error: 'projectid is required' }),
  }),
}
export type HasProjectIdParams = TypeOf<(typeof hasProjectIdZod)['params']>

export const createProjectZod = {
  body: object({
    name: string({ required_error: 'name is required' }),
    storage: zodEnum(storageValues).default('default'),
    taskType: zodEnum(taskValues, { required_error: 'taskType is required' }),
    azureStorageAccount: string().optional(),
    azurePassKey: string().optional(),
    azureContainerName: string().optional(),
    awsSecretAccessKey: string().optional(),
    awsAccessKeyId: string().optional(),
    awsRegion: string().optional(),
    awsApiVersion: string().optional(),
    awsBucketName: string().optional(),
  }),
}
export type CreateProjectBody = TypeOf<(typeof createProjectZod)['body']>

export const listProjectsZod = {
  query: object({
    userid: string().optional(),
    skip: string().optional(),
    limit: string().optional(),
  }),
}
export type ListProjectsQuery = TypeOf<(typeof listProjectsZod)['query']>

export const deleteProjectZod = {
  params: hasProjectIdZod.params,
}
export type DeleteProjectParams = TypeOf<(typeof deleteProjectZod)['params']>

export const removeUserFromProjectZod = {
  params: hasProjectIdZod.params.extend({
    userid: string({ required_error: 'userid is required' }),
  }),
}
export type RemoveUserFromProjectParams = TypeOf<
  (typeof removeUserFromProjectZod)['params']
>

export const getProjectUsersZod = {
  params: hasProjectIdZod.params,
}
export type GetProjectUsersParams = TypeOf<
  (typeof getProjectUsersZod)['params']
>

export const getProjectFilesZod = {
  params: hasProjectIdZod.params,
  query: object({
    skip: string().optional(),
    limit: string().optional(),
    hasShapes: string().optional(),
    tags: string().optional(),
    annotator: string().optional(),
    completedAfter: string().optional(),
    skippedAfter: string().optional(),
    skipped: string().optional(),
    complete: string().optional(),
    skipFileIds: string().optional(),
    assign: string().optional(),
  }),
}
export type GetProjectFilesParams = TypeOf<
  (typeof getProjectFilesZod)['params']
>
export type GetProjectFilesQuery = TypeOf<(typeof getProjectFilesZod)['query']>

export const getProjectBasicInfoZod = {
  params: hasProjectIdZod.params,
}
export type GetProjectBasicInfoParams = TypeOf<
  (typeof getProjectBasicInfoZod)['params']
>

export const getUserStatsZod = {
  params: hasProjectIdZod.params.extend({
    userid: string({ required_error: 'userid is required' }),
  }),
  query: object({ lastdays: string().optional() }),
}
export type GetUserStatsParams = TypeOf<(typeof getUserStatsZod)['params']>
export type GetUserStatsQuery = TypeOf<(typeof getUserStatsZod)['query']>

export const updateProjectZod = {
  params: hasProjectIdZod.params,
  body: object({
    name: string().optional(),
    instructions: string().optional(),
    defaultClassId: string().optional(),
  }),
}
export type UpdateProjectParams = TypeOf<(typeof updateProjectZod)['params']>
export type UpdateProjectBody = TypeOf<(typeof updateProjectZod)['body']>

export const uploadProjectInstructionFileZod = {
  params: hasOrgIdZod.params.extend({
    projectid: string({ required_error: 'projectid is required' }),
    fileid: string({ required_error: 'fileid is required' }),
  }),
}
export type UploadProjectInstructionFileParams = TypeOf<
  (typeof uploadProjectInstructionFileZod)['params']
>

export const addMembersZod = {
  body: object({
    email: string().email('Invalid email').optional(),
    role: zodEnum(inviteRoles, { required_error: 'role is required' }),
    userId: string().optional(),
  }).array(),
}
export type AddMembersBody = TypeOf<(typeof addMembersZod)['body']>

export const revertImagesFromUserZod = {
  body: object({
    userId: string({ required_error: 'userId is required' }),
  }),
}
export type RevertImagesFromUserBody = TypeOf<
  (typeof revertImagesFromUserZod)['body']
>
