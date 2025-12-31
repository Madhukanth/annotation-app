import { FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import ago from 's-ago'

import CommentType from '@models/Comment.model'
import { fetchCommentFiles } from '@renderer/helpers/axiosRequests'
import { useOrgStore } from '@renderer/store/organization.store'
import { getStoredUrl } from '@renderer/utils/vars'
import { cn } from '@renderer/utils/cn'
import { useFilesStore } from '@renderer/store/files.store'

type CommentCardProps = { comment: CommentType }
const CommentCard: FC<CommentCardProps> = ({ comment }) => {
  const orgId = useOrgStore((s) => s.selectedOrg)
  const { projectid: projectId } = useParams()
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id
  const { data: commentFiles } = useQuery(
    [
      'comment-files',
      { orgId: orgId!, projectId: projectId!, fileId: fileId!, commentId: comment.id }
    ],
    fetchCommentFiles,
    { initialData: [], enabled: !!orgId && !!projectId && !!fileId }
  )

  return (
    <div className="border border-font-0.14 mb-4 rounded-lg p-3 last:mb-0" key={comment.id}>
      <div className="flex">
        <div className="flex-grow-0 flex-shrink-0 rounded-full h-9 w-9 flex items-center justify-center bg-brand text-white">
          {comment.userId.name.slice(0, 2)}
        </div>

        <div className="ml-2 overflow-hidden">
          <p className="overflow-hidden text-ellipsis whitespace-nowrap">{comment.userId.name}</p>
          <p className="text-xs opacity-50 overflow-hidden text-ellipsis whitespace-nowrap">
            {comment.userId.email}
          </p>
          <p className="text-xs opacity-50 overflow-hidden text-ellipsis whitespace-nowrap">
            {ago(new Date(comment.createdAt))}
          </p>

          <div className="mt-2">
            <p className="overflow-visible break-words">{comment.content}</p>
          </div>
        </div>
      </div>

      <div className={cn('grid grid-cols-2 gap-1', { 'mt-2': commentFiles.length > 0 })}>
        {commentFiles.map((cf) => (
          <div
            key={cf.id}
            className="cursor-pointer rounded-md border border-font-0.14 h-20 overflow-hidden"
          >
            <img className="rounded-t-md object-cover" src={getStoredUrl(cf.url, cf.storedIn)} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default CommentCard
