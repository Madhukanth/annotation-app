import { supabase, File, StorageType, FileType, Shape } from '@/lib/supabase'
import { getShapesByFileIds } from './shapes.service'

export type FileWithTags = File & {
  tags?: { id: string; name: string; color: string }[]
}

export type ImageMetadata = {
  polygons: Shape[]
  rectangles: Shape[]
  circles: Shape[]
  faces: Shape[]
  lines: Shape[]
}

export type VideoMetadata = {
  polygons: { [frame: number]: Shape[] }
  rectangles: { [frame: number]: Shape[] }
  circles: { [frame: number]: Shape[] }
  faces: { [frame: number]: Shape[] }
  lines: { [frame: number]: Shape[] }
}

export type FileWithMetadata = FileWithTags & {
  metadata: ImageMetadata | VideoMetadata
  dbIndex: number
}

export type FilesFilter = {
  hasShapes?: boolean
  annotatorId?: string
  completedAfter?: string
  skippedAfter?: string
  skipped?: boolean
  complete?: boolean
  tags?: string[]
  search?: string
  assign?: 'true' | 'false'
}

export type UpdateFileInput = {
  complete?: boolean
  skipped?: boolean
  annotatorId?: string
  hasShapes?: boolean
  height?: number
  width?: number
}

export const getFiles = async (
  projectId: string,
  skip: number = 0,
  limit: number = 50,
  filters?: FilesFilter
): Promise<FileWithTags[]> => {
  let query = supabase
    .from('files')
    .select(
      `
      *,
      tags:file_tags(
        class:annotation_classes(id, name, color)
      )
    `
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .range(skip, skip + limit - 1)

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
  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching files:', error)
    throw error
  }

  // Transform the nested tags structure
  return (data || []).map((file) => ({
    ...file,
    tags: file.tags
      ?.map((t: { class: { id: string; name: string; color: string } | null }) => t.class)
      .filter(Boolean)
  }))
}

export const getFileById = async (fileId: string): Promise<FileWithTags | null> => {
  const { data, error } = await supabase
    .from('files')
    .select(
      `
      *,
      tags:file_tags(
        class:annotation_classes(id, name, color)
      )
    `
    )
    .eq('id', fileId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching file:', error)
    throw error
  }

  return {
    ...data,
    tags: data.tags
      ?.map((t: { class: { id: string; name: string; color: string } | null }) => t.class)
      .filter(Boolean)
  }
}

export const updateFile = async (fileId: string, input: UpdateFileInput): Promise<File> => {
  const updateData: Record<string, unknown> = {}

  if (input.complete !== undefined) {
    updateData.complete = input.complete
    if (input.complete) {
      updateData.has_shapes = true
      updateData.skipped = false
      updateData.completed_at = new Date().toISOString()
    }
  }

  if (input.skipped !== undefined) {
    updateData.skipped = input.skipped
    if (input.skipped) {
      updateData.has_shapes = false
      updateData.complete = false
      updateData.skipped_at = new Date().toISOString()
    }
  }

  if (input.annotatorId !== undefined) {
    updateData.annotator_id = input.annotatorId
    updateData.assigned_at = new Date().toISOString()
  }

  if (input.hasShapes !== undefined) {
    updateData.has_shapes = input.hasShapes
  }

  if (input.height !== undefined) {
    updateData.height = input.height
  }

  if (input.width !== undefined) {
    updateData.width = input.width
  }

  const { data, error } = await supabase
    .from('files')
    .update(updateData)
    .eq('id', fileId)
    .select()
    .single()

  if (error) {
    console.error('Error updating file:', error)
    throw error
  }

  return data
}

export const updateFileTags = async (fileId: string, tagIds: string[]): Promise<void> => {
  // Delete existing tags
  await supabase.from('file_tags').delete().eq('file_id', fileId)

  // Insert new tags
  if (tagIds.length > 0) {
    const tagInserts = tagIds.map((classId) => ({
      file_id: fileId,
      annotation_class_id: classId
    }))

    const { error } = await supabase.from('file_tags').insert(tagInserts)

    if (error) {
      console.error('Error inserting file tags:', error)
      throw error
    }
  }

  // Update file completion status based on tags
  const isComplete = tagIds.length > 0
  const updateData = isComplete
    ? { complete: true, completed_at: new Date().toISOString(), skipped: false }
    : { complete: false, skipped: true, skipped_at: new Date().toISOString() }

  await supabase.from('files').update(updateData).eq('id', fileId)
}

export const getFilesCount = async (projectId: string, filters?: FilesFilter): Promise<number> => {
  let query = supabase
    .from('files')
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
    throw error
  }

  return count || 0
}

export const assignFilesToAnnotator = async (
  fileIds: string[],
  annotatorId: string
): Promise<void> => {
  if (fileIds.length === 0) return

  const { error } = await supabase
    .from('files')
    .update({
      annotator_id: annotatorId,
      assigned_at: new Date().toISOString()
    })
    .in('id', fileIds)

  if (error) {
    console.error('Error assigning files:', error)
    throw error
  }
}

export const unassignFiles = async (fileIds: string[]): Promise<void> => {
  if (fileIds.length === 0) return

  const { error } = await supabase
    .from('files')
    .update({
      annotator_id: null,
      assigned_at: null
    })
    .in('id', fileIds)

  if (error) {
    console.error('Error unassigning files:', error)
    throw error
  }
}

export const getNextFile = async (
  projectId: string,
  currentFileId?: string,
  annotatorId?: string
): Promise<File | null> => {
  let query = supabase
    .from('files')
    .select('*')
    .eq('project_id', projectId)
    .eq('complete', false)
    .eq('skipped', false)
    .order('created_at', { ascending: true })
    .limit(1)

  if (annotatorId) {
    query = query.eq('annotator_id', annotatorId)
  }

  if (currentFileId) {
    query = query.neq('id', currentFileId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error getting next file:', error)
    throw error
  }

  return data?.[0] || null
}

export const deleteFile = async (fileId: string): Promise<void> => {
  const { error } = await supabase.from('files').delete().eq('id', fileId)

  if (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}

export const updateMultipleFileTags = async (
  fileIds: string[],
  tagIds: string[]
): Promise<void> => {
  if (fileIds.length === 0) return

  // For each file, update its tags
  for (const fileId of fileIds) {
    // Delete existing tags
    await supabase.from('file_tags').delete().eq('file_id', fileId)

    // Insert new tags
    if (tagIds.length > 0) {
      const tagInserts = tagIds.map((classId) => ({
        file_id: fileId,
        annotation_class_id: classId
      }))

      await supabase.from('file_tags').insert(tagInserts)
    }

    // Update file completion status based on tags
    const isComplete = tagIds.length > 0
    const updateData = isComplete
      ? { complete: true, completed_at: new Date().toISOString(), skipped: false }
      : { complete: false, skipped: true, skipped_at: new Date().toISOString() }

    await supabase.from('files').update(updateData).eq('id', fileId)
  }
}

const FILES_SELECT_QUERY = `
  *,
  tags:file_tags(
    class:annotation_classes(id, name, color)
  )
`

type FileQueryFilters = FilesFilter & { skipFileIds?: string[] }

// Helper to apply common filters to a query
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const applyFilters = <T extends { gt: any; eq: any; ilike: any; not: any }>(
  query: T,
  filters?: FileQueryFilters
): T => {
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
  if (filters?.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }
  if (filters?.skipFileIds && filters.skipFileIds.length > 0) {
    query = query.not('id', 'in', `(${filters.skipFileIds.join(',')})`)
  }
  return query
}

// Helper to transform raw file data with nested tags
const transformFileTags = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
): FileWithTags[] => {
  return data.map((file) => ({
    ...file,
    tags: file.tags
      ?.map((t: { class: { id: string; name: string; color: string } | null }) => t.class)
      .filter(Boolean)
  }))
}

// Helper to build metadata from shapes for files
const buildFilesMetadata = (
  files: FileWithTags[],
  shapes: Shape[],
  skip: number
): FileWithMetadata[] => {
  // Build metadata collections
  const imageMetadata: { [fileId: string]: ImageMetadata } = {}
  const videoMetadata: { [fileId: string]: VideoMetadata } = {}

  for (const file of files) {
    if (file.type === 'image') {
      imageMetadata[file.id] = {
        polygons: [],
        rectangles: [],
        circles: [],
        faces: [],
        lines: []
      }
    } else {
      videoMetadata[file.id] = {
        polygons: {},
        rectangles: {},
        circles: {},
        faces: {},
        lines: {}
      }
    }
  }

  // Populate metadata with shapes
  for (const shape of shapes) {
    const fileId = shape.file_id
    const shapeType = `${shape.type}s` as keyof ImageMetadata

    if (imageMetadata[fileId]) {
      imageMetadata[fileId][shapeType].push(shape)
    } else if (videoMetadata[fileId]) {
      const frame = shape.at_frame || 1
      if (!videoMetadata[fileId][shapeType][frame]) {
        videoMetadata[fileId][shapeType][frame] = []
      }
      videoMetadata[fileId][shapeType][frame].push(shape)
    }
  }

  // Return files with metadata
  return files.map((file, index) => ({
    ...file,
    metadata: file.type === 'video' ? videoMetadata[file.id] : imageMetadata[file.id],
    dbIndex: skip + index
  }))
}

// Get files with count for pagination - returns data with metadata
export const getFilesWithCount = async (
  projectId: string,
  skip: number = 0,
  limit: number = 50,
  filters?: FileQueryFilters
): Promise<{ files: FileWithMetadata[]; count: number }> => {
  let query = supabase
    .from('files')
    .select(FILES_SELECT_QUERY, { count: 'exact' })
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .range(skip, skip + limit - 1)

  if (filters?.annotatorId) {
    query = query.eq('annotator_id', filters.annotatorId)
  }

  query = applyFilters(query, filters)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching files:', error)
    throw error
  }

  let files = transformFileTags(data || [])

  // If no files found and assign mode is on, try to assign unassigned files
  if (files.length === 0 && filters?.assign === 'true' && filters?.annotatorId) {
    let unassignedQuery = supabase
      .from('files')
      .select(FILES_SELECT_QUERY)
      .eq('project_id', projectId)
      .is('annotator_id', null)
      .eq('complete', false)
      .eq('skipped', false)
      .order('created_at', { ascending: true })
      .range(skip, skip + limit - 1)

    unassignedQuery = applyFilters(unassignedQuery, filters)

    const { data: unassignedData, error: unassignedError } = await unassignedQuery

    if (unassignedError) {
      console.error('Error fetching unassigned files:', unassignedError)
      throw unassignedError
    }

    files = transformFileTags(unassignedData || [])
    const unassignedFileIds = files.map((f) => f.id)

    if (unassignedFileIds.length > 0) {
      await assignFilesToAnnotator(unassignedFileIds, filters.annotatorId)
    }

    // Fetch shapes for unassigned files
    const shapes = await getShapesByFileIds(unassignedFileIds)
    const filesWithMetadata = buildFilesMetadata(files, shapes, skip)

    return { files: filesWithMetadata, count: unassignedFileIds.length }
  }

  // Fetch shapes for files
  const fileIds = files.map((f) => f.id)
  const shapes = fileIds.length > 0 ? await getShapesByFileIds(fileIds) : []

  const filesWithMetadata = buildFilesMetadata(files, shapes, skip)

  return { files: filesWithMetadata, count: count || 0 }
}

export type CreateFileInput = {
  id?: string
  originalName: string
  name: string
  url: string
  relativePath: string
  storedIn: StorageType
  orgId: string
  projectId: string
  type: FileType
  totalFrames?: number
  fps?: number
  duration?: number
  height?: number
  width?: number
}

/**
 * Create a new file record directly in Supabase
 * This is used for direct file uploads that bypass the server
 */
export const createFile = async (input: CreateFileInput): Promise<File> => {
  const { data, error } = await supabase
    .from('files')
    .insert({
      id: input.id,
      original_name: input.originalName,
      name: input.name,
      url: input.url,
      relative_path: input.relativePath,
      stored_in: input.storedIn,
      org_id: input.orgId,
      project_id: input.projectId,
      type: input.type,
      total_frames: input.totalFrames || 1,
      fps: input.fps || 1,
      duration: input.duration || 0,
      height: input.height,
      width: input.width,
      complete: false,
      has_shapes: false,
      skipped: false
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating file record:', error)
    throw error
  }

  return data
}

/**
 * Create multiple file records in a batch
 */
export const createFiles = async (inputs: CreateFileInput[]): Promise<File[]> => {
  if (inputs.length === 0) return []

  const insertData = inputs.map((input) => ({
    id: input.id,
    original_name: input.originalName,
    name: input.name,
    url: input.url,
    relative_path: input.relativePath,
    stored_in: input.storedIn,
    org_id: input.orgId,
    project_id: input.projectId,
    type: input.type,
    total_frames: input.totalFrames || 1,
    fps: input.fps || 1,
    duration: input.duration || 0,
    height: input.height,
    width: input.width,
    complete: false,
    has_shapes: false,
    skipped: false
  }))

  const { data, error } = await supabase.from('files').insert(insertData).select()

  if (error) {
    console.error('Error creating file records:', error)
    throw error
  }

  return data || []
}
