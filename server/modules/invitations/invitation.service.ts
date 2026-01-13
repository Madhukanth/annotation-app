import { supabaseAdmin } from '../../config/supabase'
import { DB_TABLES } from '../../config/vars'

export type InviteRoleType = 'datamanager' | 'reviewer' | 'annotator'
export type InviteStatusType = 'pending' | 'accepted' | 'declined'

export type InvitationType = {
  id: string
  project_id: string
  role: InviteRoleType
  inviter_id: string
  invitee_id: string
  status: InviteStatusType
  created_at?: string
  updated_at?: string
}

export type InvitationWithDetails = InvitationType & {
  invitee?: { id: string; name: string; email: string }
  inviter?: { id: string; name: string; email: string }
  project?: { id: string; name: string; org_id: string; organization?: { id: string; name: string } }
}

export const dbCreateInvitation = async (
  projectId: string,
  inviter: string,
  invitee: string,
  role: InviteRoleType
): Promise<InvitationType | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.invitations)
    .insert({
      project_id: projectId,
      inviter_id: inviter,
      invitee_id: invitee,
      role: role,
      status: 'pending' as InviteStatusType,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating invitation:', error)
    return null
  }

  return data
}

export const dbGetInviteById = async (inviteId: string): Promise<InvitationType | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.invitations)
    .select('*')
    .eq('id', inviteId)
    .single()

  if (error) {
    console.error('Error getting invitation:', error)
    return null
  }

  return data
}

export const dbDeleteInvitation = async (inviteId: string): Promise<InvitationType | null> => {
  // First get the invitation to return it
  const { data: existingInvite, error: fetchError } = await supabaseAdmin
    .from(DB_TABLES.invitations)
    .select('*')
    .eq('id', inviteId)
    .single()

  if (fetchError || !existingInvite) {
    return null
  }

  const { error } = await supabaseAdmin
    .from(DB_TABLES.invitations)
    .delete()
    .eq('id', inviteId)

  if (error) {
    console.error('Error deleting invitation:', error)
    return null
  }

  return existingInvite
}

export const dbUpdateInviteStatus = async (
  inviteId: string,
  status: InviteStatusType
): Promise<InvitationType | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.invitations)
    .update({ status })
    .eq('id', inviteId)
    .select()
    .single()

  if (error) {
    console.error('Error updating invitation status:', error)
    return null
  }

  return data
}

export const dbGetInvites = async ({
  projectId,
  inviteeId,
  inviterId,
  status,
}: {
  projectId?: string
  inviterId?: string
  inviteeId?: string
  status?: InviteStatusType
}): Promise<InvitationWithDetails[]> => {
  let query = supabaseAdmin
    .from(DB_TABLES.invitations)
    .select(`
      *,
      invitee:invitee_id (id, name, email),
      inviter:inviter_id (id, name, email),
      project:project_id (
        id,
        name,
        org_id,
        organization:org_id (id, name)
      )
    `)

  if (projectId) {
    query = query.eq('project_id', projectId)
  }

  if (inviterId) {
    query = query.eq('inviter_id', inviterId)
  }

  if (inviteeId) {
    query = query.eq('invitee_id', inviteeId)
  }

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error getting invitations:', error)
    return []
  }

  // Transform the response to match expected format
  return (data || []).map((invite: any) => ({
    ...invite,
    // Handle nested project -> organization relationship
    project: invite.project ? {
      ...invite.project,
      orgId: invite.project.organization,
    } : null,
  }))
}
