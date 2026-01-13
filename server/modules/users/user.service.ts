import { supabaseAdmin } from '../../config/supabase'
import { DB_TABLES } from '../../config/vars'

export type UserType = {
  id: string
  name: string
  email: string
  role: 'superadmin' | 'orgadmin' | 'user'
}

export const dbFindUserById = async (userId: string): Promise<UserType | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.users)
    .select('id, name, email, role')
    .eq('id', userId)
    .single()

  if (error) return null
  return data
}

export const dbFindUserByEmail = async (email: string): Promise<UserType | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.users)
    .select('id, name, email, role')
    .eq('email', email.toLowerCase())
    .single()

  if (error) return null
  return data
}

export const dbSearchUsersBy = async (searchTerm?: string): Promise<UserType[]> => {
  let query = supabaseAdmin
    .from(DB_TABLES.users)
    .select('id, name, email, role')
    .limit(20)

  if (searchTerm) {
    query = query.or(`email.ilike.%${searchTerm}%,name.ilike.%${searchTerm}%`)
  }

  const { data, error } = await query

  if (error) return []
  return data
}

export const dbFindUsersByOrgId = async (orgId: string): Promise<UserType[]> => {
  // Get all users who are members of projects in this organization
  const { data, error } = await supabaseAdmin
    .rpc('get_users_in_organization', { p_org_id: orgId })

  if (error) {
    console.error('Error fetching users by org:', error)
    return []
  }
  return data || []
}

export const dbUpdateUserById = async (
  userId: string,
  updateData: Partial<Omit<UserType, 'id'>> & { password?: string }
): Promise<UserType | null> => {
  const dataToUpdate: any = { ...updateData }

  // Remove password from the update data - password changes go through Supabase Auth
  if (dataToUpdate.password) {
    // Update password in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: dataToUpdate.password }
    )
    if (authError) {
      console.error('Failed to update password:', authError)
    }
    delete dataToUpdate.password
  }

  if (dataToUpdate.email) {
    dataToUpdate.email = dataToUpdate.email.toLowerCase()
    // Also update email in Supabase Auth
    await supabaseAdmin.auth.admin.updateUserById(userId, {
      email: dataToUpdate.email,
    })
  }

  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.users)
    .update(dataToUpdate)
    .eq('id', userId)
    .select('id, name, email, role')
    .single()

  if (error) return null
  return data
}

export const dbDeleteUserById = async (userId: string): Promise<boolean> => {
  // Delete from auth.users (cascades to public.users due to FK)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  return !error
}

export const dbGetAllSuperAdmins = async (): Promise<UserType[]> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.users)
    .select('id, name, email, role')
    .eq('role', 'superadmin')

  if (error) return []
  return data
}

export const dbGetOrgAdmin = async (orgId: string): Promise<string | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.organizations)
    .select('orgadmin_id')
    .eq('id', orgId)
    .single()

  if (error) return null
  return data.orgadmin_id
}
