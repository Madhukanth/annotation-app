import { supabaseAdmin } from '../../config/supabase'
import { DB_TABLES } from '../../config/vars'

export type ActionName = 'viewed' | 'annotated' | 'skipped' | 'mark_complete' | 'mark_incomplete' | 'classified'

export type ActionType = {
  id: string
  name: ActionName
  user_id: string
  file_id: string
  project_id: string
  org_id: string
  shape_id?: string
  created_at?: string
  updated_at?: string
}

export const dbCreateAction = async (newAction: {
  name: ActionName
  orgId: string
  projectId: string
  fileId: string
  userId: string
  shapeId?: string
}): Promise<ActionType | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.actions)
    .insert({
      name: newAction.name,
      org_id: newAction.orgId,
      project_id: newAction.projectId,
      file_id: newAction.fileId,
      user_id: newAction.userId,
      ...(newAction.shapeId && { shape_id: newAction.shapeId }),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating action:', error)
    return null
  }

  return data
}

export const dbFindAction = async (
  projectId: string,
  userId: string,
  start: string,
  end: string
): Promise<ActionType[]> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.actions)
    .select('*')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .gte('created_at', new Date(start).toISOString())
    .lte('created_at', new Date(end).toISOString())

  if (error) {
    console.error('Error finding actions:', error)
    return []
  }

  return data || []
}
