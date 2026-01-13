import { supabaseAdmin } from '../../config/supabase'
import { DB_TABLES } from '../../config/vars'
import * as UserService from '../users/user.service'
import { dbGetShapesByFileIds, ShapeType, dbInsertManyShapes } from '../shapes/shapes.service'
import { dbGetAnnotationClassById, dbGetAnnotationClasses } from '../annotationclasses/annotationclasses.service'
import { parse } from 'json2csv'
import { toZonedTime, format } from 'date-fns-tz'
import { v4 as uuidv4 } from 'uuid'

export type StorageType = 'aws' | 'azure' | 'default'
export type TaskType = 'classification' | 'object-annotation'

export type ProjectType = {
  id: string
  name: string
  org_id: string
  task_type: TaskType
  instructions?: string
  storage: StorageType
  aws_secret_access_key?: string
  aws_access_key_id?: string
  aws_region?: string
  aws_api_version?: string
  aws_bucket_name?: string
  azure_storage_account?: string
  azure_pass_key?: string
  azure_container_name?: string
  is_syncing: boolean
  synced_at?: string
  prefix?: string
  default_class_id?: string
  created_at?: string
  updated_at?: string
}

export const dbCreateProject = async (
  name: string,
  orgId: string,
  adminId: string,
  storage: StorageType,
  taskType: TaskType,
  optionValues: {
    azureStorageAccount?: string
    azurePassKey?: string
    awsSecretAccessKey?: string
    awsAccessKeyId?: string
    awsRegion?: string
    awsApiVersion?: string
    awsBucketName?: string
  }
): Promise<ProjectType | null> => {
  // Create the project
  const { data: project, error } = await supabaseAdmin
    .from(DB_TABLES.projects)
    .insert({
      name,
      org_id: orgId,
      storage,
      task_type: taskType,
      is_syncing: false,
      ...(optionValues.azureStorageAccount && { azure_storage_account: optionValues.azureStorageAccount }),
      ...(optionValues.azurePassKey && { azure_pass_key: optionValues.azurePassKey }),
      ...(optionValues.awsSecretAccessKey && { aws_secret_access_key: optionValues.awsSecretAccessKey }),
      ...(optionValues.awsAccessKeyId && { aws_access_key_id: optionValues.awsAccessKeyId }),
      ...(optionValues.awsRegion && { aws_region: optionValues.awsRegion }),
      ...(optionValues.awsApiVersion && { aws_api_version: optionValues.awsApiVersion }),
      ...(optionValues.awsBucketName && { aws_bucket_name: optionValues.awsBucketName }),
    })
    .select()
    .single()

  if (error || !project) {
    console.error('Error creating project:', error)
    return null
  }

  // Add admin as data manager
  const dataManagersSet = new Set<string>()
  dataManagersSet.add(adminId)

  // Add all super admins as data managers
  const superAdmins = await UserService.dbGetAllSuperAdmins()
  for (const user of superAdmins) {
    dataManagersSet.add(user.id)
  }

  // Insert data managers into junction table
  const dataManagerInserts = Array.from(dataManagersSet).map((userId) => ({
    project_id: project.id,
    user_id: userId,
  }))

  await supabaseAdmin
    .from(DB_TABLES.projectDataManagers)
    .insert(dataManagerInserts)

  return project
}

export const dbUpdateProject = async (
  projectId: string,
  projectData: Partial<ProjectType>
): Promise<ProjectType | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.projects)
    .update(projectData)
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    console.error('Error updating project:', error)
    return null
  }

  return data
}

export const dbGetProjectById = async (projectId: string): Promise<ProjectType | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.projects)
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) {
    return null
  }

  return data
}

export const dbGetProjectFilesCount = async (
  projectId: string,
  hasShapes?: boolean,
  annotator?: string,
  completedAfter?: string,
  skippedAfter?: string,
  skipped?: boolean,
  complete?: boolean,
  tags?: string[]
): Promise<number> => {
  let query = supabaseAdmin
    .from(DB_TABLES.files)
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)

  if (annotator) {
    query = query.eq('annotator_id', annotator)
  }
  if (completedAfter) {
    query = query.gt('completed_at', new Date(completedAfter).toISOString())
  }
  if (skippedAfter) {
    query = query.gt('skipped_at', new Date(skippedAfter).toISOString())
  }
  if (hasShapes !== undefined) {
    query = query.eq('has_shapes', hasShapes)
  }
  if (skipped !== undefined) {
    query = query.eq('skipped', skipped)
  }
  if (complete !== undefined) {
    query = query.eq('complete', complete)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error getting project files count:', error)
    return 0
  }

  return count || 0
}

export const dbGetProjectFiles = async (
  orgId: string,
  projectId: string,
  skip: number = 0,
  limit: number = 20,
  hasShapes?: boolean,
  annotator?: string,
  completedAfter?: string,
  skippedAfter?: string,
  skipped?: boolean,
  complete?: boolean,
  skipFileIds?: string[],
  assign?: boolean,
  tags?: string[]
): Promise<any[]> => {
  let query = supabaseAdmin
    .from(DB_TABLES.files)
    .select('*')
    .eq('org_id', orgId)
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })
    .order('name', { ascending: true })
    .range(skip, skip + limit - 1)

  if (annotator) {
    query = query.eq('annotator_id', annotator)
  }
  if (completedAfter) {
    query = query.gt('completed_at', new Date(completedAfter).toISOString())
  }
  if (skippedAfter) {
    query = query.gt('skipped_at', new Date(skippedAfter).toISOString())
  }
  if (hasShapes !== undefined) {
    query = query.eq('has_shapes', hasShapes)
  }
  if (skipped !== undefined) {
    query = query.eq('skipped', skipped)
  }
  if (complete !== undefined) {
    query = query.eq('complete', complete)
  }
  if (skipFileIds && skipFileIds.length > 0) {
    query = query.not('id', 'in', `(${skipFileIds.join(',')})`)
  }

  let { data: files, error } = await query

  if (error) {
    console.error('Error getting project files:', error)
    return []
  }

  // If no files found and assign mode is on, find unassigned files
  if ((!files || files.length === 0) && assign && annotator) {
    const { data: unassignedFiles, error: unassignedError } = await supabaseAdmin
      .from(DB_TABLES.files)
      .select('*')
      .eq('org_id', orgId)
      .eq('project_id', projectId)
      .eq('complete', false)
      .eq('skipped', false)
      .is('annotator_id', null)
      .order('created_at', { ascending: true })
      .order('name', { ascending: true })
      .limit(limit)

    if (!unassignedError && unassignedFiles && unassignedFiles.length > 0) {
      // Assign files to annotator
      const fileIds = unassignedFiles.map((f) => f.id)
      await supabaseAdmin
        .from(DB_TABLES.files)
        .update({ annotator_id: annotator, assigned_at: new Date().toISOString() })
        .in('id', fileIds)

      files = unassignedFiles.map((f) => ({
        ...f,
        annotator_id: annotator,
        assigned_at: new Date().toISOString(),
      }))
    }
  }

  if (!files || files.length === 0) {
    return []
  }

  // Get file tags
  const fileIds = files.map((f) => f.id)
  const { data: fileTags } = await supabaseAdmin
    .from(DB_TABLES.fileTags)
    .select(`
      file_id,
      class:class_id (id, name, color)
    `)
    .in('file_id', fileIds)

  // Create file tags map
  const fileTagsMap: { [fileId: string]: any[] } = {}
  for (const tag of fileTags || []) {
    if (!fileTagsMap[tag.file_id]) {
      fileTagsMap[tag.file_id] = []
    }
    fileTagsMap[tag.file_id].push(tag.class)
  }

  // Get shapes for files
  const shapes = await dbGetShapesByFileIds(fileIds)

  // Build metadata collections
  const metadataCollection: { [fileId: string]: { [shapeType: string]: ShapeType[] } } = {}
  const videoMetadataCollection: { [fileId: string]: { [shapeType: string]: { [frame: number]: ShapeType[] } } } = {}

  for (const file of files) {
    if (file.type === 'image') {
      metadataCollection[file.id] = {
        polygons: [],
        rectangles: [],
        circles: [],
        faces: [],
        lines: [],
      }
    } else {
      videoMetadataCollection[file.id] = {
        polygons: {},
        rectangles: {},
        circles: {},
        faces: {},
        lines: {},
      }
    }
  }

  for (const shape of shapes) {
    const shapeFileId = shape.file_id

    if (metadataCollection[shapeFileId]) {
      metadataCollection[shapeFileId][`${shape.type}s`].push(shape)
    } else if (videoMetadataCollection[shapeFileId]) {
      const frame = shape.at_frame
      if (!videoMetadataCollection[shapeFileId][`${shape.type}s`][frame]) {
        videoMetadataCollection[shapeFileId][`${shape.type}s`][frame] = []
      }
      videoMetadataCollection[shapeFileId][`${shape.type}s`][frame].push(shape)
    }
  }

  const result = files.map((file, index) => ({
    ...file,
    tags: fileTagsMap[file.id] || [],
    dbIndex: skip + index,
    metadata: file.type === 'video'
      ? videoMetadataCollection[file.id]
      : metadataCollection[file.id],
  }))

  return result
}

export const dbGetProjectUsers = async (projectId: string): Promise<any> => {
  // Get data managers
  const { data: dataManagers } = await supabaseAdmin
    .from(DB_TABLES.projectDataManagers)
    .select('user:user_id (id, name, email)')
    .eq('project_id', projectId)

  // Get reviewers
  const { data: reviewers } = await supabaseAdmin
    .from(DB_TABLES.projectReviewers)
    .select('user:user_id (id, name, email)')
    .eq('project_id', projectId)

  // Get annotators
  const { data: annotators } = await supabaseAdmin
    .from(DB_TABLES.projectAnnotators)
    .select('user:user_id (id, name, email)')
    .eq('project_id', projectId)

  // Get project
  const { data: project } = await supabaseAdmin
    .from(DB_TABLES.projects)
    .select('*')
    .eq('id', projectId)
    .single()

  return {
    ...project,
    dataManagers: (dataManagers || []).map((d: any) => d.user),
    reviewers: (reviewers || []).map((r: any) => r.user),
    annotators: (annotators || []).map((a: any) => a.user),
  }
}

export const dbGetProjectsCount = async (orgId: string, userId?: string): Promise<number> => {
  if (!userId) {
    const { count, error } = await supabaseAdmin
      .from(DB_TABLES.projects)
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)

    if (error) {
      console.error('Error getting projects count:', error)
      return 0
    }
    return count || 0
  }

  // Get projects where user is data manager, reviewer, or annotator
  const { data: dmProjects } = await supabaseAdmin
    .from(DB_TABLES.projectDataManagers)
    .select('project_id')
    .eq('user_id', userId)

  const { data: reviewerProjects } = await supabaseAdmin
    .from(DB_TABLES.projectReviewers)
    .select('project_id')
    .eq('user_id', userId)

  const { data: annotatorProjects } = await supabaseAdmin
    .from(DB_TABLES.projectAnnotators)
    .select('project_id')
    .eq('user_id', userId)

  const projectIds = new Set<string>()
  for (const p of [...(dmProjects || []), ...(reviewerProjects || []), ...(annotatorProjects || [])]) {
    projectIds.add(p.project_id)
  }

  // Filter by org
  const { count } = await supabaseAdmin
    .from(DB_TABLES.projects)
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .in('id', Array.from(projectIds))

  return count || 0
}

export const dbListProjectsBy = async (
  orgId: string,
  userId?: string,
  skip: number = 0,
  limit: number = 20
): Promise<any[]> => {
  let projectIds: string[] | null = null

  if (userId) {
    // Get projects where user is data manager, reviewer, or annotator
    const { data: dmProjects } = await supabaseAdmin
      .from(DB_TABLES.projectDataManagers)
      .select('project_id')
      .eq('user_id', userId)

    const { data: reviewerProjects } = await supabaseAdmin
      .from(DB_TABLES.projectReviewers)
      .select('project_id')
      .eq('user_id', userId)

    const { data: annotatorProjects } = await supabaseAdmin
      .from(DB_TABLES.projectAnnotators)
      .select('project_id')
      .eq('user_id', userId)

    const projectIdSet = new Set<string>()
    for (const p of [...(dmProjects || []), ...(reviewerProjects || []), ...(annotatorProjects || [])]) {
      projectIdSet.add(p.project_id)
    }
    projectIds = Array.from(projectIdSet)
  }

  let query = supabaseAdmin
    .from(DB_TABLES.projects)
    .select('id, name, org_id, storage, is_syncing, synced_at, task_type, default_class_id, created_at, updated_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1)

  if (projectIds !== null) {
    if (projectIds.length === 0) return []
    query = query.in('id', projectIds)
  }

  const { data: projects, error } = await query

  if (error || !projects) {
    console.error('Error listing projects:', error)
    return []
  }

  // Get thumbnails for each project
  const projectListWithThumbnail = []
  for (const project of projects) {
    const { data: file } = await supabaseAdmin
      .from(DB_TABLES.files)
      .select('relative_path, url')
      .eq('project_id', project.id)
      .eq('type', 'image')
      .limit(1)
      .single()

    let thumbnail = null
    if (file) {
      thumbnail = !project.storage || project.storage === 'default'
        ? file.relative_path
        : file.url
    }

    projectListWithThumbnail.push({ ...project, thumbnail })
  }

  return projectListWithThumbnail
}

export const dbDeleteProject = async (projectId: string): Promise<ProjectType | null> => {
  const { data: existingProject } = await supabaseAdmin
    .from(DB_TABLES.projects)
    .select('*')
    .eq('id', projectId)
    .single()

  if (!existingProject) {
    return null
  }

  // Delete project (cascade will handle related records)
  const { error } = await supabaseAdmin
    .from(DB_TABLES.projects)
    .delete()
    .eq('id', projectId)

  if (error) {
    console.error('Error deleting project:', error)
    return null
  }

  return existingProject
}

export const dbAddDataManagerToProject = async (
  projectId: string,
  dataManagerId: string
): Promise<void> => {
  // Check if project exists
  const { data: project } = await supabaseAdmin
    .from(DB_TABLES.projects)
    .select('id')
    .eq('id', projectId)
    .single()

  if (!project) {
    throw new Error("Project doesn't exist")
  }

  // Check if already a data manager
  const { data: existing } = await supabaseAdmin
    .from(DB_TABLES.projectDataManagers)
    .select('user_id')
    .eq('project_id', projectId)
    .eq('user_id', dataManagerId)
    .single()

  if (existing) {
    return
  }

  // Remove from other roles
  await supabaseAdmin
    .from(DB_TABLES.projectAnnotators)
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', dataManagerId)

  await supabaseAdmin
    .from(DB_TABLES.projectReviewers)
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', dataManagerId)

  // Add as data manager
  await supabaseAdmin
    .from(DB_TABLES.projectDataManagers)
    .insert({ project_id: projectId, user_id: dataManagerId })
}

export const dbAddReviewerToProject = async (
  projectId: string,
  reviewerId: string
): Promise<void> => {
  const { data: project } = await supabaseAdmin
    .from(DB_TABLES.projects)
    .select('id')
    .eq('id', projectId)
    .single()

  if (!project) {
    throw new Error("Project doesn't exist")
  }

  // Check if already a reviewer
  const { data: existing } = await supabaseAdmin
    .from(DB_TABLES.projectReviewers)
    .select('user_id')
    .eq('project_id', projectId)
    .eq('user_id', reviewerId)
    .single()

  if (existing) {
    return
  }

  // Remove from other roles
  await supabaseAdmin
    .from(DB_TABLES.projectAnnotators)
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', reviewerId)

  await supabaseAdmin
    .from(DB_TABLES.projectDataManagers)
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', reviewerId)

  // Add as reviewer
  await supabaseAdmin
    .from(DB_TABLES.projectReviewers)
    .insert({ project_id: projectId, user_id: reviewerId })
}

export const dbAddAnnotatorToProject = async (
  projectId: string,
  annotatorId: string
): Promise<void> => {
  const { data: project } = await supabaseAdmin
    .from(DB_TABLES.projects)
    .select('id')
    .eq('id', projectId)
    .single()

  if (!project) {
    throw new Error("Project doesn't exist")
  }

  // Check if already an annotator
  const { data: existing } = await supabaseAdmin
    .from(DB_TABLES.projectAnnotators)
    .select('user_id')
    .eq('project_id', projectId)
    .eq('user_id', annotatorId)
    .single()

  if (existing) {
    return
  }

  // Remove from other roles
  await supabaseAdmin
    .from(DB_TABLES.projectReviewers)
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', annotatorId)

  await supabaseAdmin
    .from(DB_TABLES.projectDataManagers)
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', annotatorId)

  // Add as annotator
  await supabaseAdmin
    .from(DB_TABLES.projectAnnotators)
    .insert({ project_id: projectId, user_id: annotatorId })
}

export const dbRemoveUserFromProject = async (
  projectId: string,
  userId: string
): Promise<void> => {
  // Remove from all roles
  await supabaseAdmin
    .from(DB_TABLES.projectDataManagers)
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)

  await supabaseAdmin
    .from(DB_TABLES.projectReviewers)
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)

  await supabaseAdmin
    .from(DB_TABLES.projectAnnotators)
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)

  await dbRevertImagesFromUser(projectId, userId)
}

export const getProjectBasicInfo = async (projectId: string): Promise<{
  files: number
  completed: number
  skipped: number
  remaining: number
} | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.files)
    .select('complete, skipped')
    .eq('project_id', projectId)

  if (error) {
    console.error('Error getting project basic info:', error)
    return null
  }

  const files = data?.length || 0
  let completed = 0
  let skipped = 0
  let remaining = 0

  for (const file of data || []) {
    if (file.complete) {
      completed++
    } else if (file.skipped) {
      skipped++
    } else {
      remaining++
    }
  }

  return { files, completed, skipped, remaining }
}

export const dbGetAnnotatorsStats = async (projectId: string): Promise<any[] | null> => {
  // Get all project users
  const { data: dmUsers } = await supabaseAdmin
    .from(DB_TABLES.projectDataManagers)
    .select('user_id')
    .eq('project_id', projectId)

  const { data: reviewerUsers } = await supabaseAdmin
    .from(DB_TABLES.projectReviewers)
    .select('user_id')
    .eq('project_id', projectId)

  const { data: annotatorUsers } = await supabaseAdmin
    .from(DB_TABLES.projectAnnotators)
    .select('user_id')
    .eq('project_id', projectId)

  const allUserIds = [
    ...(dmUsers || []).map((u) => u.user_id),
    ...(reviewerUsers || []).map((u) => u.user_id),
    ...(annotatorUsers || []).map((u) => u.user_id),
  ]

  if (allUserIds.length === 0) {
    return []
  }

  // Get file stats for each user
  const { data: files } = await supabaseAdmin
    .from(DB_TABLES.files)
    .select('annotator_id, complete, skipped')
    .eq('project_id', projectId)
    .in('annotator_id', allUserIds)

  // Aggregate stats per user
  const userStats: { [userId: string]: { assigned: number; completed: number; skipped: number } } = {}

  for (const userId of allUserIds) {
    userStats[userId] = { assigned: 0, completed: 0, skipped: 0 }
  }

  for (const file of files || []) {
    if (file.annotator_id && userStats[file.annotator_id]) {
      userStats[file.annotator_id].assigned++
      if (file.complete) {
        userStats[file.annotator_id].completed++
      }
      if (file.skipped) {
        userStats[file.annotator_id].skipped++
      }
    }
  }

  // Get user info
  const { data: users } = await supabaseAdmin
    .from(DB_TABLES.users)
    .select('id, name')
    .in('id', allUserIds)

  const userIdToName: { [id: string]: string } = {}
  for (const user of users || []) {
    userIdToName[user.id] = user.name
  }

  const stats = allUserIds.map((userId) => ({
    userId,
    userName: userIdToName[userId] || '-',
    assignedCount: userStats[userId]?.assigned || 0,
    completedCount: userStats[userId]?.completed || 0,
    skippedCount: userStats[userId]?.skipped || 0,
  }))

  return stats
}

export const dbAddAutoAnnotations = async (
  orgId: string,
  projectId: string,
  prompts: {
    [fileName: string]: {
      type: 'polygon' | 'rectangle'
      classId?: string
      points: { x: number; y: number }[]
      x: number
      y: number
      w: number
      h: number
    }[]
  }
): Promise<void> => {
  const fileNameToId: { [fileName: string]: string } = {}
  const classIdToColor: { [classId: string]: string } = {}
  const shapesToInsert: any[] = []

  // Get all incomplete files
  const { count: filesCount } = await supabaseAdmin
    .from(DB_TABLES.files)
    .select('id', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('project_id', projectId)
    .eq('complete', false)
    .eq('skipped', false)

  let fileSkip = 0
  while (fileSkip < (filesCount || 0)) {
    const { data: files } = await supabaseAdmin
      .from(DB_TABLES.files)
      .select('id, name')
      .eq('org_id', orgId)
      .eq('project_id', projectId)
      .eq('complete', false)
      .eq('skipped', false)
      .range(fileSkip, fileSkip + 999)

    for (const file of files || []) {
      fileNameToId[file.name] = file.id
    }

    fileSkip += 1000
  }

  for (const fileName in prompts) {
    const fileId = fileNameToId[fileName]
    if (!fileId) {
      continue
    }

    const shapesJson = prompts[fileName]
    if (!shapesJson) {
      continue
    }

    for (let i = 0; i < shapesJson.length; i++) {
      const shape = shapesJson[i]

      let color = 'rgb(255, 0, 0)'
      if (shape.classId) {
        if (classIdToColor[shape.classId]) {
          color = classIdToColor[shape.classId]
        } else {
          const classDoc = await dbGetAnnotationClassById(shape.classId)
          if (classDoc) {
            color = classDoc.color
            classIdToColor[shape.classId] = classDoc.color
          }
        }
      }

      shapesToInsert.push({
        org_id: orgId,
        project_id: projectId,
        file_id: fileId,
        type: shape.type,
        ...(shape.x && { x: shape.x }),
        ...(shape.y && { y: shape.y }),
        ...(shape.w && { width: shape.w }),
        ...(shape.h && { height: shape.h }),
        ...(shape.classId && { class_id: shape.classId }),
        ...(shape.points && {
          points: shape.points.map((v) => ({
            id: uuidv4(),
            x: v.x,
            y: v.y,
          })),
        }),
        name: `auto ${i + 1}`,
        stroke: color,
        at_frame: 1,
        stroke_width: 2,
        notes: '',
      })
    }
  }

  await dbInsertManyShapes(shapesToInsert)
}

export const dbExportAnnotations = async (projectId: string): Promise<any> => {
  const exportJson: { [fileName: string]: any } = {}

  // Get all users
  const { data: users } = await supabaseAdmin
    .from(DB_TABLES.users)
    .select('id, name')

  const userIdToName: { [userId: string]: string } = {}
  for (const user of users || []) {
    userIdToName[user.id] = user.name
  }

  // Get annotation classes
  const annotationClasses = await dbGetAnnotationClasses(projectId, projectId, 0, 10000)
  const classIdToName: { [classId: string]: string } = {}
  for (const cls of annotationClasses) {
    classIdToName[cls.id] = cls.name
  }

  // Get files count
  const { count: filesCount } = await supabaseAdmin
    .from(DB_TABLES.files)
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)

  let skip = 0
  const limit = 1000
  while (skip < (filesCount || 0)) {
    const { data: files } = await supabaseAdmin
      .from(DB_TABLES.files)
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .range(skip, skip + limit - 1)

    const fileIdToName: { [id: string]: string } = {}
    for (const file of files || []) {
      fileIdToName[file.id] = file.name

      let completedAt: Date | string | undefined = file.complete
        ? file.completed_at
        : file.skipped
        ? file.skipped_at
        : undefined

      if (completedAt) {
        const timeZone = 'America/New_York'
        const easternTime = toZonedTime(new Date(completedAt), timeZone)
        completedAt = format(easternTime, 'yyyy-MM-dd HH:mm:ss', { timeZone })
      }

      let status: 'completed' | 'skipped' | '' = ''
      if (file.complete) {
        status = 'completed'
      } else if (file.skipped) {
        status = 'skipped'
      }

      exportJson[file.name] = {
        ...(file.height && { height: file.height }),
        ...(file.width && { width: file.width }),
        status,
        completedAt,
        completedBy: file.annotator_id ? userIdToName[file.annotator_id] : '',
        annotations: [],
      }
    }

    const fileIds = (files || []).map((f) => f.id)
    const shapes = await dbGetShapesByFileIds(fileIds)

    for (const shape of shapes) {
      const fileName = fileIdToName[shape.file_id]
      if (!fileName) continue

      const classId = shape.class_id
      let className = ''
      if (classId) {
        className = classIdToName[classId] || ''
      }

      if (shape.type === 'rectangle') {
        const dx = shape.x! + shape.width!
        const dy = shape.y! + shape.height!
        const x1 = Math.min(shape.x!, dx)
        const y1 = Math.min(shape.y!, dy)
        const x2 = Math.max(shape.x!, dx)
        const y2 = Math.max(shape.y!, dy)
        const w = x2 - x1
        const h = y2 - y1

        exportJson[fileName].annotations.push({
          points: [
            { x: parseFloat(x1.toFixed(3)), y: parseFloat(y1.toFixed(3)) },
            { x: parseFloat((x1 + w).toFixed(3)), y: parseFloat(y1.toFixed(3)) },
            { x: parseFloat(x1.toFixed(3)), y: parseFloat((y1 + h).toFixed(3)) },
            { x: parseFloat(x2.toFixed(3)), y: parseFloat(y2.toFixed(3)) },
          ],
          className,
        })
      } else if (shape.type === 'polygon' && shape.points && shape.points.length > 0) {
        exportJson[fileName].annotations.push({
          points: shape.points.map((p: any) => ({
            x: parseFloat(p.x.toFixed(3)),
            y: parseFloat(p.y.toFixed(3)),
          })),
          className,
        })
      }
    }

    skip += limit
  }

  return exportJson
}

export const dbExportClassifications = async (projectId: string): Promise<any> => {
  const exportJson: { [fileName: string]: any } = {}

  // Get all users
  const { data: users } = await supabaseAdmin
    .from(DB_TABLES.users)
    .select('id, name')

  const userIdToName: { [userId: string]: string } = {}
  for (const user of users || []) {
    userIdToName[user.id] = user.name
  }

  // Get annotation classes
  const annotationClasses = await dbGetAnnotationClasses(projectId, projectId, 0, 10000)
  const classIdToName: { [classId: string]: string } = {}
  for (const cls of annotationClasses) {
    classIdToName[cls.id] = cls.name
  }

  // Get files count
  const { count: filesCount } = await supabaseAdmin
    .from(DB_TABLES.files)
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)

  let skip = 0
  const limit = 1000
  while (skip < (filesCount || 0)) {
    const { data: files } = await supabaseAdmin
      .from(DB_TABLES.files)
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
      .range(skip, skip + limit - 1)

    for (const file of files || []) {
      let completedAt: Date | string | undefined = file.complete
        ? file.completed_at
        : file.skipped
        ? file.skipped_at
        : undefined

      if (completedAt) {
        const timeZone = 'America/New_York'
        const easternTime = toZonedTime(new Date(completedAt), timeZone)
        completedAt = format(easternTime, 'yyyy-MM-dd HH:mm:ss', { timeZone })
      }

      let status: 'completed' | 'skipped' | '' = ''
      if (file.complete) {
        status = 'completed'
      } else if (file.skipped) {
        status = 'skipped'
      }

      // Get file tags
      const { data: fileTags } = await supabaseAdmin
        .from(DB_TABLES.fileTags)
        .select('class_id')
        .eq('file_id', file.id)

      const classes = (fileTags || [])
        .map((t) => classIdToName[t.class_id])
        .filter((c) => c)

      exportJson[file.name] = {
        ...(file.height && { height: file.height }),
        ...(file.width && { width: file.width }),
        status,
        completedAt,
        completedBy: file.annotator_id ? userIdToName[file.annotator_id] : '',
        classes,
      }
    }

    skip += limit
  }

  return exportJson
}

export const dbExportImageStats = async (projectId: string): Promise<string | null> => {
  const project = await dbGetProjectById(projectId)
  if (!project) {
    return null
  }

  // Get all users
  const { data: users } = await supabaseAdmin
    .from(DB_TABLES.users)
    .select('id, name')

  const userIdToName: { [userId: string]: string } = {}
  for (const user of users || []) {
    userIdToName[user.id] = user.name
  }

  // Get annotation classes
  const annotationClasses = await dbGetAnnotationClasses(projectId, projectId, 0, 10000)
  const classIdToName: { [classId: string]: string } = {}
  for (const cls of annotationClasses) {
    classIdToName[cls.id] = cls.name
  }

  const result: any[] = []
  const { count: filesCount } = await supabaseAdmin
    .from(DB_TABLES.files)
    .select('id', { count: 'exact', head: true })
    .eq('project_id', projectId)

  let skip = 0
  while (skip < (filesCount || 0)) {
    const { data: files } = await supabaseAdmin
      .from(DB_TABLES.files)
      .select('*')
      .eq('project_id', projectId)
      .range(skip, skip + 999)

    for (const file of files || []) {
      let fileName = file.name
      const containerName = project.storage === 'azure' ? project.azure_container_name : null
      if (containerName) {
        fileName = `${containerName.split('/')[0]}/${fileName}`
      }

      let completedAt: Date | string | undefined = file.complete
        ? file.completed_at
        : file.skipped
        ? file.skipped_at
        : undefined

      if (completedAt) {
        const timeZone = 'America/New_York'
        const easternTime = toZonedTime(new Date(completedAt), timeZone)
        completedAt = format(easternTime, 'yyyy-MM-dd HH:mm:ss', { timeZone })
      }

      let status: 'completed' | 'skipped' | '' = ''
      if (file.complete) {
        status = 'completed'
      } else if (file.skipped) {
        status = 'skipped'
      }

      // Get file tags
      const { data: fileTags } = await supabaseAdmin
        .from(DB_TABLES.fileTags)
        .select('class_id')
        .eq('file_id', file.id)

      const classes = (fileTags || [])
        .map((t) => classIdToName[t.class_id])
        .filter((c) => c)

      result.push({
        name: fileName,
        status,
        completedAt,
        completedBy: file.annotator_id ? userIdToName[file.annotator_id] : '',
        classes,
        ...(file.height && { height: file.height }),
        ...(file.width && { width: file.width }),
      })
    }

    skip += 1000
  }

  return parse(result)
}

export const dbRevertImagesFromUser = async (
  projectId: string,
  userId: string
): Promise<void> => {
  await supabaseAdmin
    .from(DB_TABLES.files)
    .update({ annotator_id: null, assigned_at: null })
    .eq('project_id', projectId)
    .eq('annotator_id', userId)
    .eq('complete', false)
}

export const dbGetCompletedRangeStats = async (
  projectId: string,
  start: Date,
  end: Date
): Promise<any[]> => {
  const allDates: { [date: string]: number } = {}
  let currentDate = new Date(start)
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0]
    allDates[dateStr] = 0
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Get files in date range
  const { data: files } = await supabaseAdmin
    .from(DB_TABLES.files)
    .select('annotator_id, completed_at, skipped_at')
    .eq('project_id', projectId)
    .or(`completed_at.gte.${start.toISOString()},skipped_at.gte.${start.toISOString()}`)
    .or(`completed_at.lte.${end.toISOString()},skipped_at.lte.${end.toISOString()}`)

  // Aggregate by annotator and date
  const annotatorStats: { [annotatorId: string]: { [date: string]: number } } = {}

  for (const file of files || []) {
    if (!file.annotator_id) continue

    const date = file.completed_at
      ? new Date(file.completed_at).toISOString().split('T')[0]
      : file.skipped_at
      ? new Date(file.skipped_at).toISOString().split('T')[0]
      : null

    if (!date) continue

    if (!annotatorStats[file.annotator_id]) {
      annotatorStats[file.annotator_id] = { ...allDates }
    }

    annotatorStats[file.annotator_id][date] = (annotatorStats[file.annotator_id][date] || 0) + 1
  }

  // Get user info
  const annotatorIds = Object.keys(annotatorStats)
  const { data: users } = await supabaseAdmin
    .from(DB_TABLES.users)
    .select('id, name, email')
    .in('id', annotatorIds)

  const userInfo: { [id: string]: { name: string; email: string } } = {}
  for (const user of users || []) {
    userInfo[user.id] = { name: user.name, email: user.email }
  }

  const result = annotatorIds.map((annotatorId) => ({
    annotatorId,
    annotatorName: userInfo[annotatorId]?.name || '-',
    annotatorEmail: userInfo[annotatorId]?.email || '-',
    series: Object.entries(annotatorStats[annotatorId]).map(([date, total]) => ({
      date: new Date(date).toUTCString(),
      total,
    })),
  }))

  return result.sort((a, b) => a.annotatorName.localeCompare(b.annotatorName))
}

export const dbGetTopAnnotators = async (
  projectId: string,
  start: Date,
  end: Date
): Promise<any[]> => {
  // Get files in date range
  const { data: files } = await supabaseAdmin
    .from(DB_TABLES.files)
    .select('annotator_id, completed_at, skipped_at')
    .eq('project_id', projectId)
    .or(`completed_at.gte.${start.toISOString()},skipped_at.gte.${start.toISOString()}`)

  // Aggregate by annotator
  const annotatorStats: { [annotatorId: string]: { completed: number; skipped: number } } = {}

  for (const file of files || []) {
    if (!file.annotator_id) continue

    if (!annotatorStats[file.annotator_id]) {
      annotatorStats[file.annotator_id] = { completed: 0, skipped: 0 }
    }

    if (file.completed_at) {
      annotatorStats[file.annotator_id].completed++
    }
    if (file.skipped_at) {
      annotatorStats[file.annotator_id].skipped++
    }
  }

  // Get user info
  const annotatorIds = Object.keys(annotatorStats)
  const { data: users } = await supabaseAdmin
    .from(DB_TABLES.users)
    .select('id, name, email')
    .in('id', annotatorIds)

  const userInfo: { [id: string]: { name: string; email: string } } = {}
  for (const user of users || []) {
    userInfo[user.id] = { name: user.name, email: user.email }
  }

  const result = annotatorIds.map((annotatorId) => ({
    annotatorId,
    annotatorName: userInfo[annotatorId]?.name || '-',
    annotatorEmail: userInfo[annotatorId]?.email || '-',
    completed: annotatorStats[annotatorId].completed,
    skipped: annotatorStats[annotatorId].skipped,
  }))

  return result.sort((a, b) => b.completed - a.completed)
}
