import { supabase, Comment, User } from '@/lib/supabase'

export type CommentWithUser = Comment & {
  user?: Pick<User, 'id' | 'name' | 'email'>
}

export type CreateCommentInput = {
  content: string
  userId: string
  fileId: string
  projectId: string
  orgId: string
  shapeId?: string
  parentId?: string
}

export type UpdateCommentInput = {
  content?: string
}

export const getComments = async (fileId: string): Promise<CommentWithUser[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      user:users(id, name, email)
    `)
    .eq('file_id', fileId)
    .is('parent_id', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comments:', error)
    throw error
  }

  return data || []
}

export const getCommentReplies = async (commentId: string): Promise<CommentWithUser[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      user:users(id, name, email)
    `)
    .eq('parent_id', commentId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comment replies:', error)
    throw error
  }

  return data || []
}

export const getCommentById = async (commentId: string): Promise<CommentWithUser | null> => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      user:users(id, name, email)
    `)
    .eq('id', commentId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    console.error('Error fetching comment:', error)
    throw error
  }

  return data
}

export const createComment = async (input: CreateCommentInput): Promise<Comment> => {
  const insertData: Record<string, unknown> = {
    content: input.content,
    user_id: input.userId,
    file_id: input.fileId,
    project_id: input.projectId,
    org_id: input.orgId,
  }

  if (input.shapeId) insertData.shape_id = input.shapeId
  if (input.parentId) insertData.parent_id = input.parentId

  const { data, error } = await supabase
    .from('comments')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    console.error('Error creating comment:', error)
    throw error
  }

  return data
}

export const updateComment = async (commentId: string, input: UpdateCommentInput): Promise<Comment> => {
  const updateData: Record<string, unknown> = {}

  if (input.content !== undefined) updateData.content = input.content

  const { data, error } = await supabase
    .from('comments')
    .update(updateData)
    .eq('id', commentId)
    .select()
    .single()

  if (error) {
    console.error('Error updating comment:', error)
    throw error
  }

  return data
}

export const deleteComment = async (commentId: string): Promise<void> => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Error deleting comment:', error)
    throw error
  }
}

export const getCommentsByShapeId = async (shapeId: string): Promise<CommentWithUser[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      user:users(id, name, email)
    `)
    .eq('shape_id', shapeId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comments by shape:', error)
    throw error
  }

  return data || []
}
