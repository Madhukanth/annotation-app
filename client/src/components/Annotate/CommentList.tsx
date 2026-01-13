import { FC, useMemo } from 'react'

import AddComment from './AddComment'
import CommentCard from './CommentCard'
import { useImageUntrackedStore } from '@renderer/pages/ImageAnnotate/store/image.store'
import { useFilesStore } from '@renderer/store/files.store'
import { useComments } from '@/hooks/useComments'

const CommentList: FC = () => {
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id
  const selectedShape = useImageUntrackedStore((s) => s.selectedShape)

  const shapeId = selectedShape?.id
  const { data: rawCommentList = [] } = useComments(fileId || '', shapeId)

  // Transform Supabase format to legacy format
  const commentList = useMemo(() => {
    return rawCommentList.map((comment) => ({
      id: comment.id,
      userId: comment.user
        ? { ...comment.user, role: 'user' as const }
        : { id: comment.user_id, name: 'Unknown', email: '', role: 'user' as const },
      fileId: comment.file_id,
      projectId: comment.project_id,
      orgId: comment.org_id,
      content: comment.content || '',
      createdAt: comment.created_at || ''
    }))
  }, [rawCommentList])

  return (
    <div className="p-1 h-full gap-4 grid" style={{ gridTemplateRows: 'auto minmax(0, 1fr)' }}>
      <AddComment />

      <div className="overflow-scroll">
        {commentList.map((comment) => (
          <CommentCard key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  )
}

export default CommentList
