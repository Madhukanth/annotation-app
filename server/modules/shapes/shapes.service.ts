import { supabaseAdmin } from '../../config/supabase'
import { DB_TABLES } from '../../config/vars'
import * as FileService from '../files/file.service'
import { dbGetAnnotationClassById } from '../annotationclasses/annotationclasses.service'

export type ShapeTypeEnum = 'polygon' | 'rectangle' | 'circle' | 'face' | 'line'

export type ShapeType = {
  id: string
  name: string
  type: ShapeTypeEnum
  notes?: string
  stroke: string
  stroke_width: number
  x?: number
  y?: number
  height?: number
  width?: number
  points?: { id: string; x: number; y: number }[]
  org_id: string
  project_id: string
  file_id: string
  class_id?: string
  text_field?: string
  id_field?: string
  attribute?: string
  at_frame: number
  created_at?: string
  updated_at?: string
}

export const dbCreateShape = async (
  orgId: string,
  projectId: string,
  fileId: string,
  userId: string,
  newShape: Partial<ShapeType> & { classId?: string }
): Promise<ShapeType | null> => {
  let stroke = newShape.stroke || 'rgb(255, 0, 0)'

  // Get color from class if classId is provided
  const classId = newShape.classId || newShape.class_id
  if (classId) {
    const classDoc = await dbGetAnnotationClassById(classId)
    if (classDoc) {
      stroke = classDoc.color
    }
  }

  const insertData: any = {
    name: newShape.name || 'Shape',
    type: newShape.type,
    stroke,
    stroke_width: newShape.stroke_width || 2,
    org_id: orgId,
    project_id: projectId,
    file_id: fileId,
    at_frame: newShape.at_frame || 1,
    ...(newShape.notes && { notes: newShape.notes }),
    ...(newShape.x !== undefined && { x: newShape.x }),
    ...(newShape.y !== undefined && { y: newShape.y }),
    ...(newShape.height !== undefined && { height: newShape.height }),
    ...(newShape.width !== undefined && { width: newShape.width }),
    ...(newShape.points && { points: newShape.points }),
    ...(classId && { class_id: classId }),
    ...(newShape.text_field && { text_field: newShape.text_field }),
    ...(newShape.id_field && { id_field: newShape.id_field }),
    ...(newShape.attribute && { attribute: newShape.attribute }),
  }

  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.shapes)
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Error creating shape:', error)
    return null
  }

  await FileService.updateHasShapes(fileId, true)
  return data
}

export const dbUpdateShape = async (
  orgId: string,
  projectId: string,
  fileId: string,
  userId: string,
  shapeId: string,
  partialData: Partial<ShapeType> & { classId?: string }
): Promise<ShapeType | null> => {
  const updateData: any = { ...partialData }

  // Handle classId -> class_id conversion
  const classId = partialData.classId || partialData.class_id
  if (classId) {
    const classDoc = await dbGetAnnotationClassById(classId)
    if (classDoc) {
      updateData.stroke = classDoc.color
    }
    updateData.class_id = classId
    delete updateData.classId
  }

  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.shapes)
    .update(updateData)
    .eq('id', shapeId)
    .select()
    .single()

  if (error) {
    console.error('Error updating shape:', error)
    return null
  }

  await FileService.updateHasShapes(fileId, true)
  return data
}

export const dbDeleteShape = async (shapeId: string): Promise<ShapeType | null> => {
  // Get the shape first
  const { data: existingShape } = await supabaseAdmin
    .from(DB_TABLES.shapes)
    .select('*')
    .eq('id', shapeId)
    .single()

  if (!existingShape) {
    return null
  }

  // Delete the shape
  const { error } = await supabaseAdmin
    .from(DB_TABLES.shapes)
    .delete()
    .eq('id', shapeId)

  if (error) {
    console.error('Error deleting shape:', error)
    return null
  }

  // Check if file still has shapes
  const { data: remainingShapes } = await supabaseAdmin
    .from(DB_TABLES.shapes)
    .select('id')
    .eq('file_id', existingShape.file_id)
    .limit(1)

  if (!remainingShapes || remainingShapes.length === 0) {
    await FileService.updateHasShapes(existingShape.file_id, false)
  }

  return existingShape
}

export const dbGetShapes = async (
  orgId: string,
  projectId: string,
  fileId: string
): Promise<ShapeType[]> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.shapes)
    .select('*')
    .eq('file_id', fileId)

  if (error) {
    console.error('Error getting shapes:', error)
    return []
  }

  return data || []
}

export const dbGetShapesByFileIds = async (fileIds: string[]): Promise<ShapeType[]> => {
  if (fileIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.shapes)
    .select('*')
    .in('file_id', fileIds)

  if (error) {
    console.error('Error getting shapes by file ids:', error)
    return []
  }

  return data || []
}

export const dbInsertManyShapes = async (
  shapes: Omit<ShapeType, 'id' | 'created_at' | 'updated_at'>[]
): Promise<void> => {
  if (shapes.length === 0) return

  // Insert in batches of 1000
  const batchSize = 1000
  for (let i = 0; i < shapes.length; i += batchSize) {
    const batch = shapes.slice(i, i + batchSize)
    const { error } = await supabaseAdmin
      .from(DB_TABLES.shapes)
      .insert(batch)

    if (error) {
      console.error('Error inserting shapes batch:', error)
    }
  }
}
