import { supabase, User } from '@/lib/supabase'

export type UserWithOrg = User & {
  organizations?: { id: string; name: string }[]
}

export type CreateUserInput = {
  email: string
  password: string
  name: string
  role?: 'superadmin' | 'orgadmin' | 'user'
  orgId?: string
}

export type UpdateUserInput = {
  name?: string
  email?: string
  role?: 'superadmin' | 'orgadmin' | 'user'
}

export const getUsers = async (orgId?: string): Promise<User[]> => {
  if (orgId) {
    // Get users in organization via project membership or org admin
    const { data, error } = await supabase.rpc('get_users_in_organization', {
      p_org_id: orgId,
    })

    if (error) {
      console.error('Error fetching users in org:', error)
      throw error
    }

    return data || []
  }

  // Get all users (superadmin only)
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    throw error
  }

  return data || []
}

export const getUserById = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching user:', error)
    throw error
  }

  return data
}

export const searchUsers = async (searchTerm: string): Promise<User[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role')
    .ilike('email', `%${searchTerm}%`)
    .limit(20)

  if (error) {
    console.error('Error searching users:', error)
    throw error
  }

  return data || []
}

export const updateUser = async (userId: string, input: UpdateUserInput): Promise<User> => {
  const updateData: Record<string, unknown> = {}

  if (input.name !== undefined) updateData.name = input.name
  if (input.email !== undefined) updateData.email = input.email
  if (input.role !== undefined) updateData.role = input.role

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error updating user:', error)
    throw error
  }

  return data
}

export const deleteUser = async (userId: string): Promise<void> => {
  // Delete from auth.users will cascade to public.users
  const { error } = await supabase.auth.admin.deleteUser(userId)

  if (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}

export const createUser = async (input: CreateUserInput): Promise<User> => {
  // Create user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        name: input.name,
        role: input.role || 'user',
      },
    },
  })

  if (authError) {
    console.error('Error creating user:', authError)
    throw authError
  }

  if (!authData.user) {
    throw new Error('User creation failed')
  }

  // The user profile should be created via trigger, but let's ensure it exists
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', authData.user.id)
    .single()

  if (error) {
    // If profile doesn't exist, create it manually
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: input.email,
        name: input.name,
        role: input.role || 'user',
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating user profile:', insertError)
      throw insertError
    }

    return newUser
  }

  return data
}

export const getProjectUsers = async (
  projectId: string
): Promise<{
  dataManagers: User[]
  reviewers: User[]
  annotators: User[]
}> => {
  const [dmResult, reviewerResult, annotatorResult] = await Promise.all([
    supabase
      .from('project_data_managers')
      .select('user:users(id, name, email, role)')
      .eq('project_id', projectId),
    supabase
      .from('project_reviewers')
      .select('user:users(id, name, email, role)')
      .eq('project_id', projectId),
    supabase
      .from('project_annotators')
      .select('user:users(id, name, email, role)')
      .eq('project_id', projectId),
  ])

  // Extract users from the joined query results
  const extractUsers = (
    data: { user: { id: string; name: string; email: string; role: string } | null }[] | null
  ): User[] => {
    if (!data) return []
    return data
      .map((d) => d.user)
      .filter((u): u is { id: string; name: string; email: string; role: string } => u !== null) as User[]
  }

  return {
    dataManagers: extractUsers(dmResult.data as { user: { id: string; name: string; email: string; role: string } | null }[] | null),
    reviewers: extractUsers(reviewerResult.data as { user: { id: string; name: string; email: string; role: string } | null }[] | null),
    annotators: extractUsers(annotatorResult.data as { user: { id: string; name: string; email: string; role: string } | null }[] | null),
  }
}
