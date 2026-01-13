import { supabaseAdmin } from '../../config/supabase'
import { DB_TABLES } from '../../config/vars'
import * as ActionService from '../action/action.service'
import { dbGetShapesByFileIds, ShapeType } from '../shapes/shapes.service'

export type StorageType = 'aws' | 'azure' | 'default'
export type FileTypeEnum = 'image' | 'video'

export type FileType = {
  id: string
  original_name?: string
  name?: string
  url?: string
  relative_path?: string
  stored_in: StorageType
  org_id: string
  project_id: string
  type?: FileTypeEnum
  annotator_id?: string
  assigned_at?: string
  complete: boolean
  total_frames: number
  fps: number
  duration: number
  has_shapes: boolean
  annotated_at?: string
  skipped: boolean
  completed_at?: string
  skipped_at?: string
  height?: number
  width?: number
  created_at?: string
  updated_at?: string
}

export type FileWithTags = FileType & {
  tags?: { id: string; name: string; color: string }[]
}

export const dbCreateFile = async (
  newFile: Omit<FileType, 'id' | 'created_at' | 'updated_at'>
): Promise<FileType | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.files)
    .insert(newFile)
    .select()
    .single()

  if (error) {
    console.error('Error creating file:', error)
    return null
  }

  return data
}

export const dbGetFileByOriginalName = async (originalName: string): Promise<FileType | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.files)
    .select('*')
    .eq('original_name', originalName)
    .single()

  if (error) {
    return null
  }

  return data
}

export const dbUpdateFileCollection = async (
  orgId: string,
  projectId: string,
  fileId: string,
  userId: string,
  fileData: Partial<FileType> & { tags?: string[] }
): Promise<FileType | null> => {
  const updateData: any = { ...fileData }

  // Handle complete/skipped status changes
  if (fileData.complete) {
    updateData.has_shapes = true
    updateData.skipped = false
    updateData.completed_at = new Date().toISOString()
  }

  if (fileData.skipped) {
    updateData.has_shapes = false
    updateData.complete = false
    updateData.skipped_at = new Date().toISOString()
  }

  // Remove tags from update data as we handle it separately
  const hasTags = 'tags' in fileData
  delete updateData.tags

  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.files)
    .update(updateData)
    .eq('id', fileId)
    .select()
    .single()

  if (error) {
    console.error('Error updating file:', error)
    return null
  }

  // Create actions based on the update
  if (hasTags) {
    await ActionService.dbCreateAction({
      name: 'classified',
      orgId,
      projectId,
      fileId,
      userId,
    })
  }

  if (fileData.complete) {
    await ActionService.dbCreateAction({
      name: 'mark_complete',
      orgId,
      projectId,
      fileId,
      userId,
    })
  }

  if (fileData.skipped) {
    await ActionService.dbCreateAction({
      name: 'skipped',
      orgId,
      projectId,
      fileId,
      userId,
    })
  }

  return data
}

export const dbUpdateFileTags = async (
  orgId: string,
  projectId: string,
  fileId: string,
  tags: string[]
): Promise<FileType | null> => {
  const isComplete = tags.length > 0

  // First, delete existing tags for this file
  await supabaseAdmin
    .from(DB_TABLES.fileTags)
    .delete()
    .eq('file_id', fileId)

  // Insert new tags
  if (tags.length > 0) {
    const tagInserts = tags.map((tagId) => ({
      file_id: fileId,
      class_id: tagId,
    }))

    await supabaseAdmin
      .from(DB_TABLES.fileTags)
      .insert(tagInserts)
  }

  // Update file status
  const updateData: any = isComplete
    ? { complete: true, completed_at: new Date().toISOString(), skipped: false }
    : { complete: false, skipped: true, skipped_at: new Date().toISOString() }

  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.files)
    .update(updateData)
    .eq('id', fileId)
    .eq('org_id', orgId)
    .eq('project_id', projectId)
    .select()
    .single()

  if (error) {
    console.error('Error updating file tags:', error)
    return null
  }

  return data
}

export const dbUpdateFileTagsByName = async (
  orgId: string,
  projectId: string,
  fileName: string,
  tags: string[]
): Promise<FileType | null> => {
  // First get the file
  const { data: file } = await supabaseAdmin
    .from(DB_TABLES.files)
    .select('id')
    .eq('org_id', orgId)
    .eq('project_id', projectId)
    .eq('name', fileName)
    .single()

  if (!file) {
    return null
  }

  // Delete existing tags
  await supabaseAdmin
    .from(DB_TABLES.fileTags)
    .delete()
    .eq('file_id', file.id)

  // Insert new tags
  if (tags.length > 0) {
    const tagInserts = tags.map((tagId) => ({
      file_id: file.id,
      class_id: tagId,
    }))

    await supabaseAdmin
      .from(DB_TABLES.fileTags)
      .insert(tagInserts)
  }

  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.files)
    .select('*')
    .eq('id', file.id)
    .single()

  if (error) {
    return null
  }

  return data
}

export const dbDeleteFile = async (fileId: string): Promise<FileType | null> => {
  // Get the file first
  const { data: existingFile } = await supabaseAdmin
    .from(DB_TABLES.files)
    .select('*')
    .eq('id', fileId)
    .single()

  if (!existingFile) {
    return null
  }

  // Delete the file (cascade will handle related records)
  const { error } = await supabaseAdmin
    .from(DB_TABLES.files)
    .delete()
    .eq('id', fileId)

  if (error) {
    console.error('Error deleting file:', error)
    return null
  }

  return existingFile
}

export const dbCreateMany = async (
  files: Omit<FileType, 'id' | 'created_at' | 'updated_at'>[]
): Promise<FileType[]> => {
  if (files.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.files)
    .insert(files)
    .select()

  if (error) {
    console.error('Error creating many files:', error)
    return []
  }

  return data || []
}

export const dbUpdateFileById = async (
  fileId: string,
  uData: Partial<FileType>
): Promise<FileType | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.files)
    .update(uData)
    .eq('id', fileId)
    .select()
    .single()

  if (error) {
    console.error('Error updating file:', error)
    return null
  }

  return data
}

export const updateHasShapes = async (fileId: string, hasShapes: boolean): Promise<void> => {
  await supabaseAdmin
    .from(DB_TABLES.files)
    .update({ has_shapes: hasShapes })
    .eq('id', fileId)
}

export const dbExportShapes = async (
  orgId: string,
  projectId: string,
  skip: number,
  limit: number,
  annotatedAfter?: Date | string
): Promise<{ [fileName: string]: { points: { x: number; y: number }[]; classId: string }[] }> => {
  let query = supabaseAdmin
    .from(DB_TABLES.files)
    .select('*')
    .eq('org_id', orgId)
    .eq('project_id', projectId)
    .eq('has_shapes', true)
    .range(skip, skip + limit - 1)

  if (annotatedAfter) {
    query = query.gte('annotated_at', new Date(annotatedAfter).toISOString())
  }

  const { data: files, error } = await query

  if (error || !files) {
    console.error('Error fetching files for export:', error)
    return {}
  }

  const result: { [fileName: string]: { points: { x: number; y: number }[]; classId: string }[] } = {}

  const fileIds = files.map((file) => file.id)
  const shapes = await dbGetShapesByFileIds(fileIds)

  // Create fileId to fileName mapping
  const fileIdToName: { [id: string]: string } = {}
  for (const file of files) {
    fileIdToName[file.id] = file.name || file.id
  }

  for (const shape of shapes) {
    if (!shape.points || shape.points.length === 0) {
      continue
    }

    const fileName = fileIdToName[shape.file_id]
    if (!fileName) continue

    if (!result[fileName]) {
      result[fileName] = []
    }

    const points = shape.points.map((p: { x: number; y: number }) => ({ x: p.x, y: p.y }))
    result[fileName].push({
      points,
      classId: shape.class_id || '',
    })
  }

  return result
}

export const dbCreateFilesFromCloud = async (
  fileData: {
    orgId: string
    projectId: string
    storedIn: StorageType
    blobName: string
    url: string
  }[]
): Promise<string[]> => {
  const rawFiles: Omit<FileType, 'id' | 'created_at' | 'updated_at'>[] = []

  for (const data of fileData) {
    rawFiles.push({
      name: data.blobName,
      original_name: data.blobName,
      relative_path: '',
      stored_in: data.storedIn,
      url: data.url,
      type: 'image',
      project_id: data.projectId,
      org_id: data.orgId,
      complete: false,
      fps: 1,
      total_frames: 1,
      duration: 0,
      has_shapes: false,
      skipped: false,
    })
  }

  if (rawFiles.length === 0) {
    return []
  }

  const createdFiles = await dbCreateMany(rawFiles)
  return createdFiles.map((file) => file.id)
}

export const dbGetFilesByProjectIdAndUserId = async (
  projectId: string,
  userId: string
): Promise<FileType[]> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.files)
    .select('*')
    .eq('project_id', projectId)
    .eq('annotator_id', userId)

  if (error) {
    console.error('Error getting files by project and user:', error)
    return []
  }

  return data || []
}

export const dbGetFileById = async (fileId: string): Promise<FileType | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.files)
    .select('*')
    .eq('id', fileId)
    .single()

  if (error) {
    return null
  }

  return data
}

export const dbGetFilesCount = async (
  projectId: string,
  filters?: {
    hasShapes?: boolean
    annotatorId?: string
    completedAfter?: string
    skippedAfter?: string
    skipped?: boolean
    complete?: boolean
    tags?: string[]
  }
): Promise<number> => {
  let query = supabaseAdmin
    .from(DB_TABLES.files)
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)

  if (filters?.annotatorId) {
    query = query.eq('annotator_id', filters.annotatorId)
  }
  if (filters?.completedAfter) {
    query = query.gt('completed_at', new Date(filters.completedAfter).toISOString())
  }
  if (filters?.skippedAfter) {
    query = query.gt('skipped_at', new Date(filters.skippedAfter).toISOString())
  }
  if (filters?.hasShapes !== undefined) {
    query = query.eq('has_shapes', filters.hasShapes)
  }
  if (filters?.skipped !== undefined) {
    query = query.eq('skipped', filters.skipped)
  }
  if (filters?.complete !== undefined) {
    query = query.eq('complete', filters.complete)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error getting files count:', error)
    return 0
  }

  return count || 0
}

export const dbUpdateManyFiles = async (
  fileIds: string[],
  updateData: Partial<FileType>
): Promise<void> => {
  if (fileIds.length === 0) return

  await supabaseAdmin
    .from(DB_TABLES.files)
    .update(updateData)
    .in('id', fileIds)
}
