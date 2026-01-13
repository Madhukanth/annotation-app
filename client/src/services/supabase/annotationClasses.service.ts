import { supabase, AnnotationClass } from '@/lib/supabase'

export type CreateAnnotationClassInput = {
  name: string
  color: string
  orgId: string
  projectId: string
  attributes?: string[]
  hasText?: boolean
  hasId?: boolean
  notes?: string
}

export type UpdateAnnotationClassInput = {
  name?: string
  color?: string
  attributes?: string[]
  hasText?: boolean
  hasId?: boolean
  notes?: string
}

export const getAnnotationClasses = async (projectId: string): Promise<AnnotationClass[]> => {
  const { data, error } = await supabase
    .from('annotation_classes')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching annotation classes:', error)
    throw error
  }

  return data || []
}

export const getAnnotationClassById = async (classId: string): Promise<AnnotationClass | null> => {
  const { data, error } = await supabase
    .from('annotation_classes')
    .select('*')
    .eq('id', classId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching annotation class:', error)
    throw error
  }

  return data
}

export const createAnnotationClass = async (
  input: CreateAnnotationClassInput
): Promise<AnnotationClass> => {
  const { data, error } = await supabase
    .from('annotation_classes')
    .insert({
      name: input.name,
      color: input.color,
      org_id: input.orgId,
      project_id: input.projectId,
      attributes: input.attributes || [],
      has_text: input.hasText || false,
      has_id: input.hasId || false,
      notes: input.notes
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating annotation class:', error)
    throw error
  }

  return data
}

export const updateAnnotationClass = async (
  classId: string,
  input: UpdateAnnotationClassInput
): Promise<AnnotationClass> => {
  const updateData: Record<string, unknown> = {}

  if (input.name !== undefined) updateData.name = input.name
  if (input.color !== undefined) updateData.color = input.color
  if (input.attributes !== undefined) updateData.attributes = input.attributes
  if (input.hasText !== undefined) updateData.has_text = input.hasText
  if (input.hasId !== undefined) updateData.has_id = input.hasId
  if (input.notes !== undefined) updateData.notes = input.notes

  const { data, error } = await supabase
    .from('annotation_classes')
    .update(updateData)
    .eq('id', classId)
    .select()
    .single()

  if (error) {
    console.error('Error updating annotation class:', error)
    throw error
  }

  return data
}

export const deleteAnnotationClass = async (classId: string): Promise<void> => {
  const { error } = await supabase.from('annotation_classes').delete().eq('id', classId)

  if (error) {
    console.error('Error deleting annotation class:', error)
    throw error
  }
}

export const searchAnnotationClasses = async (
  projectId: string,
  options?: { skip?: number; limit?: number; name?: string }
): Promise<AnnotationClass[]> => {
  let query = supabase
    .from('annotation_classes')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (options?.name) {
    query = query.ilike('name', `%${options.name}%`)
  }

  if (options?.skip !== undefined && options?.limit !== undefined) {
    query = query.range(options.skip, options.skip + options.limit - 1)
  } else if (options?.limit !== undefined) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error searching annotation classes:', error)
    throw error
  }

  return data || []
}
