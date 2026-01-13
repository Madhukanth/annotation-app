import httpStatus from 'http-status'
import APIError from '../../errors/api-error'
import { supabaseAdmin } from '../../config/supabase'
import { DB_TABLES } from '../../config/vars'

export type AnnotationClassType = {
  id: string
  name: string
  attributes: string[]
  has_text: boolean
  has_id: boolean
  org_id: string
  project_id: string
  color: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export const dbCreateManyAnnotationClasses = async (
  annotationClassesData: Omit<AnnotationClassType, 'id' | 'created_at' | 'updated_at'>[]
): Promise<void> => {
  for (const cls of annotationClassesData) {
    await dbCreateAnnotationClass(cls)
  }
}

export const dbCreateAnnotationClass = async (
  annotationClassData: Omit<AnnotationClassType, 'id' | 'created_at' | 'updated_at'>
): Promise<AnnotationClassType> => {
  const { org_id, project_id, name } = annotationClassData

  // Check if class with same name already exists
  const { data: existingClass } = await supabaseAdmin
    .from(DB_TABLES.annotationClasses)
    .select('id')
    .eq('org_id', org_id)
    .eq('project_id', project_id)
    .eq('name', name)
    .single()

  if (existingClass) {
    throw new APIError(
      `Class with name ${name} already exist`,
      httpStatus.BAD_REQUEST
    )
  }

  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.annotationClasses)
    .insert(annotationClassData)
    .select()
    .single()

  if (error) {
    console.error('Error creating annotation class:', error)
    throw new APIError('Failed to create annotation class', httpStatus.INTERNAL_SERVER_ERROR)
  }

  return data
}

export const dbGetAnnotationClasses = async (
  orgId: string,
  projectId: string,
  skip: number,
  limit: number,
  name?: string
): Promise<AnnotationClassType[]> => {
  let query = supabaseAdmin
    .from(DB_TABLES.annotationClasses)
    .select('*')
    .eq('org_id', orgId)
    .eq('project_id', projectId)
    .range(skip, skip + limit - 1)

  if (name) {
    query = query.ilike('name', `%${name}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error getting annotation classes:', error)
    return []
  }

  return data || []
}

export const dbUpdateAnnotationClass = async (
  orgId: string,
  projectId: string,
  classId: string,
  updateData: Partial<AnnotationClassType>
): Promise<AnnotationClassType | null> => {
  // Check for duplicate name if name is being updated
  if (updateData.name) {
    const { data: duplicateName } = await supabaseAdmin
      .from(DB_TABLES.annotationClasses)
      .select('id')
      .eq('org_id', orgId)
      .eq('project_id', projectId)
      .eq('name', updateData.name)
      .neq('id', classId)
      .single()

    if (duplicateName) {
      throw new APIError(
        `Class with name ${updateData.name} already exist`,
        httpStatus.BAD_REQUEST
      )
    }
  }

  // Get the old document first
  const { data: oldDoc } = await supabaseAdmin
    .from(DB_TABLES.annotationClasses)
    .select('*')
    .eq('id', classId)
    .single()

  if (!oldDoc) {
    return null
  }

  // Update the annotation class
  const { data: updatedDoc, error } = await supabaseAdmin
    .from(DB_TABLES.annotationClasses)
    .update(updateData)
    .eq('id', classId)
    .select()
    .single()

  if (error || !updatedDoc) {
    console.error('Error updating annotation class:', error)
    return null
  }

  // Find deleted attributes
  const deletedAttributes: string[] = []
  for (const oAttr of oldDoc.attributes || []) {
    if (!(updatedDoc.attributes || []).includes(oAttr)) {
      deletedAttributes.push(oAttr)
    }
  }

  // Update shapes with the new color and remove fields if necessary
  const shapeUpdateData: any = { stroke: updatedDoc.color }

  if (!updatedDoc.has_text) {
    shapeUpdateData.text_field = null
  }

  if (!updatedDoc.has_id) {
    shapeUpdateData.id_field = null
  }

  if ((updatedDoc.attributes || []).length === 0) {
    shapeUpdateData.attribute = null
  }

  await supabaseAdmin
    .from(DB_TABLES.shapes)
    .update(shapeUpdateData)
    .eq('class_id', classId)

  // Remove deleted attributes from shapes
  if (deletedAttributes.length > 0) {
    for (const attr of deletedAttributes) {
      await supabaseAdmin
        .from(DB_TABLES.shapes)
        .update({ attribute: null })
        .eq('class_id', classId)
        .eq('attribute', attr)
    }
  }

  return updatedDoc
}

export const dbDeleteAnnotationClass = async (classId: string): Promise<AnnotationClassType | null> => {
  // Get the class first
  const { data: existingClass } = await supabaseAdmin
    .from(DB_TABLES.annotationClasses)
    .select('*')
    .eq('id', classId)
    .single()

  if (!existingClass) {
    return null
  }

  // Delete the class
  const { error } = await supabaseAdmin
    .from(DB_TABLES.annotationClasses)
    .delete()
    .eq('id', classId)

  if (error) {
    console.error('Error deleting annotation class:', error)
    return null
  }

  // Update shapes that were using this class
  await supabaseAdmin
    .from(DB_TABLES.shapes)
    .update({
      class_id: null,
      attribute: null,
      text_field: null,
      id_field: null,
      stroke: 'rgb(255, 0, 0)',
    })
    .eq('class_id', classId)

  // Check if there are any classes left for this project
  const { data: classList } = await supabaseAdmin
    .from(DB_TABLES.annotationClasses)
    .select('id')
    .eq('project_id', existingClass.project_id)

  if (!classList || classList.length === 0) {
    // Remove default class from project
    await supabaseAdmin
      .from(DB_TABLES.projects)
      .update({ default_class_id: null })
      .eq('id', existingClass.project_id)
  }

  return existingClass
}

export const dbGetAnnotationClassByNames = async (
  orgId: string,
  projectId: string,
  names: string[]
): Promise<{ id: string }[]> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.annotationClasses)
    .select('id')
    .eq('org_id', orgId)
    .eq('project_id', projectId)
    .in('name', names)

  if (error) {
    console.error('Error getting annotation classes by names:', error)
    return []
  }

  return data || []
}

export const dbGetAnnotationClassById = async (classId: string): Promise<AnnotationClassType | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.annotationClasses)
    .select('*')
    .eq('id', classId)
    .single()

  if (error) {
    return null
  }

  return data
}
