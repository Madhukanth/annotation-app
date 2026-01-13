import { supabaseAdmin } from '../../config/supabase'
import { DB_TABLES } from '../../config/vars'

export type CommentType = {
  id: string
  user_id: string
  file_id: string
  project_id: string
  org_id: string
  shape_id?: string
  content?: string
  created_at?: string
  updated_at?: string
}

export type CommentWithUser = CommentType & {
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
}

export const dbListComments = async (
  orgId: string,
  projectId: string,
  fileId: string,
  shapeId?: string
): Promise<CommentWithUser[]> => {
  let query = supabaseAdmin
    .from(DB_TABLES.comments)
    .select(`
      *,
      user:user_id (id, name, email, role)
    `)
    .eq('org_id', orgId)
    .eq('project_id', projectId)
    .eq('file_id', fileId)
    .order('created_at', { ascending: false })

  if (shapeId) {
    query = query.eq('shape_id', shapeId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error listing comments:', error)
    return []
  }

  // Transform the response to match expected format
  return (data || []).map((comment: any) => ({
    ...comment,
    userId: comment.user, // Keep backward compatibility
  }))
}

export const dbCreateComment = async (newComment: {
  userId: string
  fileId: string
  projectId: string
  orgId: string
  shapeId?: string
  content?: string
}): Promise<CommentType | null> => {
  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.comments)
    .insert({
      user_id: newComment.userId,
      file_id: newComment.fileId,
      project_id: newComment.projectId,
      org_id: newComment.orgId,
      ...(newComment.shapeId && { shape_id: newComment.shapeId }),
      ...(newComment.content && { content: newComment.content }),
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating comment:', error)
    return null
  }

  return data
}

export const dbUpdateComment = async (
  commentId: string,
  updatedComment: Partial<{ content: string; shapeId: string }>
): Promise<CommentType | null> => {
  const updateData: any = {}
  if (updatedComment.content !== undefined) {
    updateData.content = updatedComment.content
  }
  if (updatedComment.shapeId !== undefined) {
    updateData.shape_id = updatedComment.shapeId
  }

  const { data, error } = await supabaseAdmin
    .from(DB_TABLES.comments)
    .update(updateData)
    .eq('id', commentId)
    .select()
    .single()

  if (error) {
    console.error('Error updating comment:', error)
    return null
  }

  return data
}

export const dbDeleteComment = async (commentId: string): Promise<CommentType | null> => {
  // First get the comment to return it
  const { data: existingComment, error: fetchError } = await supabaseAdmin
    .from(DB_TABLES.comments)
    .select('*')
    .eq('id', commentId)
    .single()

  if (fetchError || !existingComment) {
    return null
  }

  const { error } = await supabaseAdmin
    .from(DB_TABLES.comments)
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Error deleting comment:', error)
    return null
  }

  return existingComment
}
