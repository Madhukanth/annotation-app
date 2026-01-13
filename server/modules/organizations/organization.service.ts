import { supabaseAdmin } from '../../config/supabase'
import { DB_TABLES } from '../../config/vars'

export type OrganizationType = {
  id: string
  name: string
  orgadmin_id: string | null
  created_at?: string
  updated_at?: string
}

export const dbCreateOrganization = async (
  name: string,
  adminId: string
): Promise<OrganizationType | null> => {
  // Create organization
  const { data: orgData, error: orgError } = await supabaseAdmin
    .from(DB_TABLES.organizations)
    .insert({
      name,
      orgadmin_id: adminId,
    })
    .select()
    .single()

  if (orgError) {
    console.error('Failed to create organization:', orgError)
    return null
  }

  return orgData
}

export const dbGetOrganizations = async (
  userId?: string
): Promise<OrganizationType[]> => {
  if (!userId) {
    const { data, error } = await supabaseAdmin
      .from(DB_TABLES.organizations)
      .select('id, name, orgadmin_id')
      .limit(30)

    if (error) return []
    return data
  }

  // Get organizations where user is a member (via project roles or org admin)
  // First check if user is org admin
  const { data: adminOrgs, error: adminError } = await supabaseAdmin
    .from(DB_TABLES.organizations)
    .select('id, name, orgadmin_id')
    .eq('orgadmin_id', userId)

  // Then get orgs via project membership
  const { data: projectOrgs, error: projectError } = await supabaseAdmin
    .rpc('get_user_organizations_via_projects', { p_user_id: userId })

  if (adminError && projectError) return []

  // Combine and dedupe results
  const orgsMap = new Map<string, OrganizationType>()

  if (adminOrgs) {
    adminOrgs.forEach((org: OrganizationType) => orgsMap.set(org.id, org))
  }

  if (projectOrgs) {
    projectOrgs.forEach((org: OrganizationType) => {
      if (!orgsMap.has(org.id)) {
        orgsMap.set(org.id, org)
      }
    })
  }

  return Array.from(orgsMap.values())
}

export const dbGetOrganizationById = async (
  orgId: string
): Promise<OrganizationType | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.organizations)
    .select('id, name, orgadmin_id')
    .eq('id', orgId)
    .single()

  if (error) return null
  return data
}

export const dbUpdateOrganization = async (
  orgId: string,
  updateData: Partial<Omit<OrganizationType, 'id'>>
): Promise<OrganizationType | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.organizations)
    .update(updateData)
    .eq('id', orgId)
    .select()
    .single()

  if (error) return null
  return data
}

export const dbDeleteOrganization = async (orgId: string): Promise<boolean> => {
  const { error } = await supabaseAdmin
    .from(DB_TABLES.organizations)
    .delete()
    .eq('id', orgId)

  return !error
}
