import { array, object, string, TypeOf, enum as zodEnum } from 'zod'

import { inviteRoles, inviteStatus } from './invitation.model'

export const hasOrgIdAndProjectIdZod = {
  params: object({
    orgid: string({ required_error: 'orgid is required' }),
    projectid: string({ required_error: 'projectid is required' }),
  }),
}
export type HasOrgIdAndProjectIdParams = TypeOf<
  (typeof hasOrgIdAndProjectIdZod)['params']
>

export const getInvitesZod = {
  query: object({
    status: zodEnum(inviteStatus).optional(),
    inviterid: string().optional(),
    inviteeid: string().optional(),
    projectid: string().optional(),
  }),
}
export type GetInivitesQuery = TypeOf<(typeof getInvitesZod)['query']>

export const createInvitationZod = {
  body: object({
    inviter: string({ required_error: 'inviter is required' }),
    invitees: array(string(), { required_error: 'invitees is required' }),
    role: zodEnum(inviteRoles, { required_error: 'role is required' }),
  }),
}
export type CreateInvitationBody = TypeOf<(typeof createInvitationZod)['body']>

export const deleteInvitationZod = {
  params: hasOrgIdAndProjectIdZod.params.extend({
    inviteid: string({ required_error: 'inviteid is required' }),
  }),
}
export type DeleteInvitationParams = TypeOf<
  (typeof deleteInvitationZod)['params']
>

export const updateInvitationStatusZod = {
  params: hasOrgIdAndProjectIdZod.params.extend({
    inviteid: string({ required_error: 'inviteid is required' }),
  }),
  body: object({
    status: zodEnum(inviteStatus, { required_error: 'status is required' }),
  }),
}
export type UpdateInvitationStatusParams = TypeOf<
  (typeof updateInvitationStatusZod)['params']
>
export type UpdateInvitationStatusBody = TypeOf<
  (typeof updateInvitationStatusZod)['body']
>

export const getInvitationsReceivedZod = {}
