import { supabase, Action, ActionType } from '@/lib/supabase'

export type CreateActionInput = {
  name: ActionType
  userId: string
  fileId: string
  projectId: string
  orgId: string
  shapeId?: string
}

export type ActionsFilter = {
  userId?: string
  fileId?: string
  name?: ActionType
  after?: string
  before?: string
}

export const createAction = async (input: CreateActionInput): Promise<Action> => {
  const insertData: Record<string, unknown> = {
    name: input.name,
    user_id: input.userId,
    file_id: input.fileId,
    project_id: input.projectId,
    org_id: input.orgId,
  }

  if (input.shapeId) insertData.shape_id = input.shapeId

  const { data, error } = await supabase
    .from('actions')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Error creating action:', error)
    throw error
  }

  return data
}

export const getActions = async (
  projectId: string,
  skip: number = 0,
  limit: number = 50,
  filters?: ActionsFilter
): Promise<Action[]> => {
  let query = supabase
    .from('actions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1)

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId)
  }
  if (filters?.fileId) {
    query = query.eq('file_id', filters.fileId)
  }
  if (filters?.name) {
    query = query.eq('name', filters.name)
  }
  if (filters?.after) {
    query = query.gt('created_at', new Date(filters.after).toISOString())
  }
  if (filters?.before) {
    query = query.lt('created_at', new Date(filters.before).toISOString())
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching actions:', error)
    throw error
  }

  return data || []
}

export const getActionsCount = async (projectId: string, filters?: ActionsFilter): Promise<number> => {
  let query = supabase
    .from('actions')
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)

  if (filters?.userId) {
    query = query.eq('user_id', filters.userId)
  }
  if (filters?.fileId) {
    query = query.eq('file_id', filters.fileId)
  }
  if (filters?.name) {
    query = query.eq('name', filters.name)
  }
  if (filters?.after) {
    query = query.gt('created_at', new Date(filters.after).toISOString())
  }
  if (filters?.before) {
    query = query.lt('created_at', new Date(filters.before).toISOString())
  }

  const { count, error } = await query

  if (error) {
    console.error('Error getting actions count:', error)
    throw error
  }

  return count || 0
}

export const getActionsByFile = async (fileId: string): Promise<Action[]> => {
  const { data, error } = await supabase
    .from('actions')
    .select('*')
    .eq('file_id', fileId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching file actions:', error)
    throw error
  }

  return data || []
}
