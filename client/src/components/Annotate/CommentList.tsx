import { FC } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { useOrgStore } from '@renderer/store/organization.store'
import { fetchComments } from '@renderer/helpers/axiosRequests'
import AddComment from './AddComment'
import CommentCard from './CommentCard'
import { useImageUntrackedStore } from '@renderer/pages/ImageAnnotate/store/image.store'
import { useFilesStore } from '@renderer/store/files.store'

const CommentList: FC = () => {
  const orgId = useOrgStore((s) => s.selectedOrg)
  const { projectid: projectId } = useParams()
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id
  const selectedShape = useImageUntrackedStore((s) => s.selectedShape)

  const shapeId = selectedShape?.id
  const { data: commentList } = useQuery(
    [
      'comments',
      { orgId: orgId!, projectId: projectId!, fileId: fileId!, shapeId: shapeId || undefined }
    ],
    fetchComments,
    { enabled: !!orgId && !!projectId && !!fileId, initialData: [] }
  )

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
