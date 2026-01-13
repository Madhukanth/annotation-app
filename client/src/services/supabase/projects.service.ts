import { supabase, Project, User, StorageType, TaskType } from '@/lib/supabase'

export type CreateProjectInput = {
  name: string
  orgId: string
  taskType: TaskType
  storage: StorageType
  awsSecretAccessKey?: string
  awsAccessKeyId?: string
  awsRegion?: string
  awsApiVersion?: string
  awsBucketName?: string
  azureStorageAccount?: string
  azurePassKey?: string
  azureContainerName?: string
  prefix?: string
}

export type ProjectWithStats = Project & {
  totalFiles?: number
  completedFiles?: number
  skippedFiles?: number
  annotationClasses?: { id: string; name: string; color: string }[]
  dataManagers?: Pick<User, 'id' | 'name' | 'email'>[]
  reviewers?: Pick<User, 'id' | 'name' | 'email'>[]
  annotators?: Pick<User, 'id' | 'name' | 'email'>[]
}

export type UpdateProjectInput = {
  name?: string
  instructions?: string
  taskType?: 'classification' | 'object-annotation'
  defaultClassId?: string
  prefix?: string
}

export type ProjectListItem = Project & {
  dataManagerIds: string[]
  thumbnail: string | null
}

export const getProjects = async (orgId: string): Promise<ProjectListItem[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects:', error)
    throw error
  }

  if (!data || data.length === 0) return []

  // Get data managers for all projects
  const projectIds = data.map((p) => p.id)
  const { data: dmData } = await supabase
    .from('project_data_managers')
    .select('project_id, user_id')
    .in('project_id', projectIds)

  // Map data managers to projects
  const dmByProject = new Map<string, string[]>()
  dmData?.forEach((dm) => {
    const existing = dmByProject.get(dm.project_id) || []
    existing.push(dm.user_id)
    dmByProject.set(dm.project_id, existing)
  })

  // Get first image file for each project as thumbnail
  const { data: filesData } = await supabase
    .from('files')
    .select('id, project_id, relative_path, url')
    .in('project_id', projectIds)
    .eq('type', 'image')
    .order('created_at', { ascending: true })

  // Map first image to each project
  const thumbnailByProject = new Map<string, string>()
  filesData?.forEach((file) => {
    // Only set if not already set (keeps first image)
    if (!thumbnailByProject.has(file.project_id)) {
      // For default storage, use relative_path; for cloud storage, use url
      thumbnailByProject.set(file.project_id, file.url || '')
    }
  })

  return data.map((project) => ({
    ...project,
    dataManagerIds: dmByProject.get(project.id) || [],
    thumbnail: thumbnailByProject.get(project.id) || null
  }))
}

export const getProjectById = async (projectId: string): Promise<ProjectWithStats | null> => {
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching project:', error)
    throw error
  }

  // Get file counts
  const [totalResult, completedResult, skippedResult] = await Promise.all([
    supabase.from('files').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
    supabase
      .from('files')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('complete', true),
    supabase
      .from('files')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('skipped', true)
  ])

  // Get annotation classes
  const { data: annotationClasses } = await supabase
    .from('annotation_classes')
    .select('id, name, color')
    .eq('project_id', projectId)

  // Get team members
  const [dataManagersResult, reviewersResult, annotatorsResult] = await Promise.all([
    supabase
      .from('project_data_managers')
      .select('user:users(id, name, email)')
      .eq('project_id', projectId),
    supabase
      .from('project_reviewers')
      .select('user:users(id, name, email)')
      .eq('project_id', projectId),
    supabase
      .from('project_annotators')
      .select('user:users(id, name, email)')
      .eq('project_id', projectId)
  ])

  return {
    ...project,
    totalFiles: totalResult.count || 0,
    completedFiles: completedResult.count || 0,
    skippedFiles: skippedResult.count || 0,
    annotationClasses: annotationClasses || [],
    dataManagers: dataManagersResult.data?.map((d) => d.user).filter(Boolean) || [],
    reviewers: reviewersResult.data?.map((r) => r.user).filter(Boolean) || [],
    annotators: annotatorsResult.data?.map((a) => a.user).filter(Boolean) || []
  }
}

export const updateProject = async (
  projectId: string,
  input: UpdateProjectInput
): Promise<Project> => {
  const updateData: Record<string, unknown> = {}

  if (input.name !== undefined) updateData.name = input.name
  if (input.instructions !== undefined) updateData.instructions = input.instructions
  if (input.taskType !== undefined) updateData.task_type = input.taskType
  if (input.defaultClassId !== undefined) updateData.default_class_id = input.defaultClassId
  if (input.prefix !== undefined) updateData.prefix = input.prefix

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    console.error('Error updating project:', error)
    throw error
  }

  return data
}

export const deleteProject = async (projectId: string): Promise<void> => {
  const { error } = await supabase.from('projects').delete().eq('id', projectId)

  if (error) {
    console.error('Error deleting project:', error)
    throw error
  }
}

export const addProjectMember = async (
  projectId: string,
  userId: string,
  role: 'datamanager' | 'reviewer' | 'annotator'
): Promise<void> => {
  const table =
    role === 'datamanager'
      ? 'project_data_managers'
      : role === 'reviewer'
      ? 'project_reviewers'
      : 'project_annotators'

  const { error } = await supabase.from(table).insert({
    project_id: projectId,
    user_id: userId
  })

  if (error) {
    console.error(`Error adding ${role}:`, error)
    throw error
  }
}

export const removeProjectMember = async (
  projectId: string,
  userId: string,
  role: 'datamanager' | 'reviewer' | 'annotator'
): Promise<void> => {
  const table =
    role === 'datamanager'
      ? 'project_data_managers'
      : role === 'reviewer'
      ? 'project_reviewers'
      : 'project_annotators'

  const { error } = await supabase
    .from(table)
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId)

  if (error) {
    console.error(`Error removing ${role}:`, error)
    throw error
  }
}

export const getProjectsByUser = async (userId: string): Promise<Project[]> => {
  // Get projects where user is a member (any role)
  const [dmResult, reviewerResult, annotatorResult] = await Promise.all([
    supabase.from('project_data_managers').select('project_id').eq('user_id', userId),
    supabase.from('project_reviewers').select('project_id').eq('user_id', userId),
    supabase.from('project_annotators').select('project_id').eq('user_id', userId)
  ])

  const projectIds = new Set<string>()
  dmResult.data?.forEach((d) => projectIds.add(d.project_id))
  reviewerResult.data?.forEach((r) => projectIds.add(r.project_id))
  annotatorResult.data?.forEach((a) => projectIds.add(a.project_id))

  if (projectIds.size === 0) return []

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .in('id', Array.from(projectIds))
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user projects:', error)
    throw error
  }

  return data || []
}

/**
 * Create a new project directly in Supabase
 * This bypasses the server and creates the project directly in the database
 */
export const createProject = async (input: CreateProjectInput): Promise<Project> => {
  // Get current user
  const {
    data: { user }
  } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Create the project
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      name: input.name,
      org_id: input.orgId,
      task_type: input.taskType,
      storage: input.storage,
      is_syncing: false,
      // AWS config
      aws_secret_access_key: input.awsSecretAccessKey || null,
      aws_access_key_id: input.awsAccessKeyId || null,
      aws_region: input.awsRegion || null,
      aws_api_version: input.awsApiVersion || null,
      aws_bucket_name: input.awsBucketName || null,
      // Azure config
      azure_storage_account: input.azureStorageAccount || null,
      azure_pass_key: input.azurePassKey || null,
      azure_container_name: input.azureContainerName || null,
      prefix: input.prefix || null
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating project:', error)
    throw error
  }

  // Add the current user as a data manager
  const { error: dmError } = await supabase.from('project_data_managers').insert({
    project_id: project.id,
    user_id: user.id
  })

  if (dmError) {
    console.error('Error adding data manager:', dmError)
    // Don't throw - the project was created, we just failed to add the data manager
  }

  return project
}
