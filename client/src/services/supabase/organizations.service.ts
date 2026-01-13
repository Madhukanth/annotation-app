import { supabase, Organization } from '@/lib/supabase'

export const getOrganizations = async (userId: string): Promise<Organization[]> => {
  // Get organizations where user is org admin
  const { data: adminOrgs, error: adminError } = await supabase
    .from('organizations')
    .select('id, name, orgadmin_id, created_at, updated_at')
    .eq('orgadmin_id', userId)

  // Get organizations via project membership
  const { data: projectOrgs, error: projectError } = await supabase.rpc(
    'get_user_organizations_via_projects',
    { p_user_id: userId }
  )

  if (adminError && projectError) {
    console.error('Error fetching organizations:', adminError || projectError)
    throw adminError || projectError
  }

  // Combine and dedupe results
  const orgsMap = new Map<string, Organization>()

  if (adminOrgs) {
    adminOrgs.forEach((org) => orgsMap.set(org.id, org as Organization))
  }

  if (projectOrgs) {
    projectOrgs.forEach((org: Organization) => {
      if (!orgsMap.has(org.id)) {
        orgsMap.set(org.id, org)
      }
    })
  }

  return Array.from(orgsMap.values())
}

export const getOrganizationById = async (orgId: string): Promise<Organization | null> => {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching organization:', error)
    throw error
  }

  return data
}

export const createOrganization = async (name: string, orgAdminId: string): Promise<Organization> => {
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name,
      orgadmin_id: orgAdminId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating organization:', error)
    throw error
  }

  return data
}

export const updateOrganization = async (
  orgId: string,
  updates: { name?: string; orgadmin_id?: string }
): Promise<Organization> => {
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', orgId)
    .select()
    .single()

  if (error) {
    console.error('Error updating organization:', error)
    throw error
  }

  return data
}

export const deleteOrganization = async (orgId: string): Promise<void> => {
  const { error } = await supabase.from('organizations').delete().eq('id', orgId)

  if (error) {
    console.error('Error deleting organization:', error)
    throw error
  }
}
