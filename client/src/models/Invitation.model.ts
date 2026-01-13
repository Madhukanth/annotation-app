export const inviteRoles = ['datamanager', 'reviewer', 'annotator'] as const
export type InviteRoleType = (typeof inviteRoles)[number]

export const inviteStatus = ['pending', 'accepted', 'declined'] as const
export type InviteStatusType = (typeof inviteStatus)[number]

export type InvitationType = {
  id: string
  projectId: {
    id: string
    name: string
    orgId: {
      id: string
      name: string
    }
  }
  role: InviteRoleType
  inviter: {
    id: string
    name: string
  }
  invitee: { id: string; name: string; email: string }
  status: InviteStatusType
}
