export const inviteRoles = ['datamanager', 'reviewer', 'annotator'] as const
export type InviteRoleType = (typeof inviteRoles)[number]

export const inviteStatus = ['pending', 'accepted', 'declined'] as const
export type InviteStatusType = (typeof inviteStatus)[number]

export type InvitationType = {
  id: string
  projectId: string
  role: InviteRoleType
  inviter: string
  invitee: { id: string; name: string; email: string }
  status: InviteStatusType
}
