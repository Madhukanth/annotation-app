import { supabase, Invitation, InviteRole, InviteStatus, User } from '@/lib/supabase'

export type InvitationWithUsers = Invitation & {
  inviter?: Pick<User, 'id' | 'name' | 'email'>
  invitee?: Pick<User, 'id' | 'name' | 'email'>
  project?: { id: string; name: string; org?: { id: string; name: string } }
}

export type CreateInvitationInput = {
  projectId: string
  role: InviteRole
  inviterId: string
  inviteeId: string
}

export const getInvitations = async (projectId: string): Promise<InvitationWithUsers[]> => {
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      *,
      inviter:users!inviter_id(id, name, email),
      invitee:users!invitee_id(id, name, email),
      project:projects(id, name)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invitations:', error)
    throw error
  }

  return data || []
}

export const getInvitationsByUser = async (userId: string): Promise<InvitationWithUsers[]> => {
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      *,
      inviter:users!inviter_id(id, name, email),
      invitee:users!invitee_id(id, name, email),
      project:projects(id, name, org:organizations(id, name))
    `)
    .eq('invitee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user invitations:', error)
    throw error
  }

  return data || []
}

export const getInvitationById = async (invitationId: string): Promise<InvitationWithUsers | null> => {
  const { data, error } = await supabase
    .from('invitations')
    .select(`
      *,
      inviter:users!inviter_id(id, name, email),
      invitee:users!invitee_id(id, name, email),
      project:projects(id, name)
    `)
    .eq('id', invitationId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching invitation:', error)
    throw error
  }

  return data
}

export const createInvitation = async (input: CreateInvitationInput): Promise<Invitation> => {
  // Check if invitation already exists
  const { data: existing } = await supabase
    .from('invitations')
    .select('id')
    .eq('project_id', input.projectId)
    .eq('invitee_id', input.inviteeId)
    .eq('status', 'pending')
    .single()

  if (existing) {
    throw new Error('User already has a pending invitation to this project')
  }

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      project_id: input.projectId,
      role: input.role,
      inviter_id: input.inviterId,
      invitee_id: input.inviteeId,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating invitation:', error)
    throw error
  }

  return data
}

export const updateInvitationStatus = async (
  invitationId: string,
  status: InviteStatus
): Promise<Invitation> => {
  const { data, error } = await supabase
    .from('invitations')
    .update({ status })
    .eq('id', invitationId)
    .select()
    .single()

  if (error) {
    console.error('Error updating invitation:', error)
    throw error
  }

  return data
}

export const acceptInvitation = async (invitationId: string): Promise<void> => {
  // Get the invitation
  const invitation = await getInvitationById(invitationId)
  if (!invitation) {
    throw new Error('Invitation not found')
  }

  if (invitation.status !== 'pending') {
    throw new Error('Invitation is no longer pending')
  }

  // Add user to project based on role
  const table =
    invitation.role === 'datamanager'
      ? 'project_data_managers'
      : invitation.role === 'reviewer'
        ? 'project_reviewers'
        : 'project_annotators'

  await supabase.from(table).insert({
    project_id: invitation.project_id,
    user_id: invitation.invitee_id,
  })

  // Update invitation status
  await updateInvitationStatus(invitationId, 'accepted')
}

export const declineInvitation = async (invitationId: string): Promise<void> => {
  await updateInvitationStatus(invitationId, 'declined')
}

export const deleteInvitation = async (invitationId: string): Promise<void> => {
  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)

  if (error) {
    console.error('Error deleting invitation:', error)
    throw error
  }
}
