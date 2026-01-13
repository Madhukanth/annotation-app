import { supabase, Shape, ShapeType } from '@/lib/supabase'
import { getAnnotationClassById } from './annotationClasses.service'

export type CreateShapeInput = {
  id?: string
  name?: string
  type: ShapeType
  orgId: string
  projectId: string
  fileId: string
  classId?: string
  notes?: string
  strokeWidth?: number
  x?: number
  y?: number
  height?: number
  width?: number
  points?: { id: string; x: number; y: number }[]
  textField?: string
  idField?: string
  attribute?: string
  atFrame?: number
}

export type UpdateShapeInput = {
  name?: string
  type?: ShapeType
  classId?: string
  notes?: string
  stroke?: string
  strokeWidth?: number
  x?: number
  y?: number
  height?: number
  width?: number
  points?: { id: string; x: number; y: number }[]
  textField?: string
  idField?: string
  attribute?: string
  atFrame?: number
}

export const getShapes = async (fileId: string): Promise<Shape[]> => {
  const { data, error } = await supabase
    .from('shapes')
    .select('*')
    .eq('file_id', fileId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching shapes:', error)
    throw error
  }

  return data || []
}

export const getShapeById = async (shapeId: string): Promise<Shape | null> => {
  const { data, error } = await supabase
    .from('shapes')
    .select('*')
    .eq('id', shapeId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching shape:', error)
    throw error
  }

  return data
}

export const createShape = async (input: CreateShapeInput): Promise<Shape> => {
  let stroke = 'rgb(255, 0, 0)'

  // Get color from class if classId is provided
  if (input.classId) {
    const classDoc = await getAnnotationClassById(input.classId)
    if (classDoc) {
      stroke = classDoc.color
    }
  }

  const insertData: Record<string, unknown> = {
    name: input.name || 'Shape',
    type: input.type,
    stroke,
    stroke_width: input.strokeWidth || 2,
    org_id: input.orgId,
    project_id: input.projectId,
    file_id: input.fileId,
    at_frame: input.atFrame || 1,
  }

  // If an ID is provided, use it (allows syncing local and server IDs)
  if (input.id) insertData.id = input.id

  if (input.notes) insertData.notes = input.notes
  if (input.x !== undefined) insertData.x = input.x
  if (input.y !== undefined) insertData.y = input.y
  if (input.height !== undefined) insertData.height = input.height
  if (input.width !== undefined) insertData.width = input.width
  if (input.points) insertData.points = input.points
  if (input.classId) insertData.class_id = input.classId
  if (input.textField) insertData.text_field = input.textField
  if (input.idField) insertData.id_field = input.idField
  if (input.attribute) insertData.attribute = input.attribute

  const { data, error } = await supabase
    .from('shapes')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Error creating shape:', error)
    throw error
  }

  // Update file has_shapes flag
  await supabase
    .from('files')
    .update({ has_shapes: true })
    .eq('id', input.fileId)

  return data
}

export const updateShape = async (shapeId: string, input: UpdateShapeInput): Promise<Shape> => {
  const updateData: Record<string, unknown> = {}

  if (input.name !== undefined) updateData.name = input.name
  if (input.type !== undefined) updateData.type = input.type
  if (input.notes !== undefined) updateData.notes = input.notes
  if (input.stroke !== undefined) updateData.stroke = input.stroke
  if (input.strokeWidth !== undefined) updateData.stroke_width = input.strokeWidth
  if (input.x !== undefined) updateData.x = input.x
  if (input.y !== undefined) updateData.y = input.y
  if (input.height !== undefined) updateData.height = input.height
  if (input.width !== undefined) updateData.width = input.width
  if (input.points !== undefined) updateData.points = input.points
  if (input.textField !== undefined) updateData.text_field = input.textField
  if (input.idField !== undefined) updateData.id_field = input.idField
  if (input.attribute !== undefined) updateData.attribute = input.attribute
  if (input.atFrame !== undefined) updateData.at_frame = input.atFrame

  // Handle classId -> class_id conversion with color update
  if (input.classId !== undefined) {
    const classDoc = await getAnnotationClassById(input.classId)
    if (classDoc) {
      updateData.stroke = classDoc.color
    }
    updateData.class_id = input.classId
  }

  const { data, error } = await supabase
    .from('shapes')
    .update(updateData)
    .eq('id', shapeId)
    .select()
    .single()

  if (error) {
    console.error('Error updating shape:', error)
    throw error
  }

  return data
}

export const deleteShape = async (shapeId: string): Promise<void> => {
  // Get the shape first to know the file_id
  const { data: shape } = await supabase
    .from('shapes')
    .select('file_id')
    .eq('id', shapeId)
    .single()

  if (!shape) {
    throw new Error('Shape not found')
  }

  const { error } = await supabase
    .from('shapes')
    .delete()
    .eq('id', shapeId)

  if (error) {
    console.error('Error deleting shape:', error)
    throw error
  }

  // Check if file still has shapes
  const { data: remainingShapes } = await supabase
    .from('shapes')
    .select('id')
    .eq('file_id', shape.file_id)
    .limit(1)

  if (!remainingShapes || remainingShapes.length === 0) {
    await supabase
      .from('files')
      .update({ has_shapes: false })
      .eq('id', shape.file_id)
  }
}

export const getShapesByFileIds = async (fileIds: string[]): Promise<Shape[]> => {
  if (fileIds.length === 0) return []

  const { data, error } = await supabase
    .from('shapes')
    .select('*')
    .in('file_id', fileIds)

  if (error) {
    console.error('Error fetching shapes by file ids:', error)
    throw error
  }

  return data || []
}
