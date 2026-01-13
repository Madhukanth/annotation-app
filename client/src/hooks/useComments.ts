import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as commentsService from '@/services/supabase/comments.service'
import type { CreateCommentInput, UpdateCommentInput } from '@/services/supabase/comments.service'

export const commentsKeys = {
  all: ['comments'] as const,
  lists: () => [...commentsKeys.all, 'list'] as const,
  list: (fileId: string) => [...commentsKeys.lists(), fileId] as const,
  byShape: (shapeId: string) => [...commentsKeys.all, 'shape', shapeId] as const,
  replies: (commentId: string) => [...commentsKeys.all, 'replies', commentId] as const,
  details: () => [...commentsKeys.all, 'detail'] as const,
  detail: (id: string) => [...commentsKeys.details(), id] as const,
}

export const useComments = (fileId: string, shapeId?: string) => {
  // If shapeId is provided, get comments by shape, otherwise get all file comments
  return useQuery({
    queryKey: shapeId ? commentsKeys.byShape(shapeId) : commentsKeys.list(fileId),
    queryFn: () => shapeId
      ? commentsService.getCommentsByShapeId(shapeId)
      : commentsService.getComments(fileId),
    enabled: !!fileId,
  })
}

export const useCommentReplies = (commentId: string) => {
  return useQuery({
    queryKey: commentsKeys.replies(commentId),
    queryFn: () => commentsService.getCommentReplies(commentId),
    enabled: !!commentId,
  })
}

export const useCommentsByShape = (shapeId: string) => {
  return useQuery({
    queryKey: commentsKeys.byShape(shapeId),
    queryFn: () => commentsService.getCommentsByShapeId(shapeId),
    enabled: !!shapeId,
  })
}

export const useComment = (commentId: string) => {
  return useQuery({
    queryKey: commentsKeys.detail(commentId),
    queryFn: () => commentsService.getCommentById(commentId),
    enabled: !!commentId,
  })
}

export const useCreateComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCommentInput) => commentsService.createComment(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: commentsKeys.list(data.file_id),
      })
      if (data.shape_id) {
        queryClient.invalidateQueries({
          queryKey: commentsKeys.byShape(data.shape_id),
        })
      }
    },
  })
}

export const useUpdateComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      commentId,
      input,
      fileId,
      shapeId,
    }: {
      commentId: string
      input: UpdateCommentInput
      fileId: string
      shapeId?: string
    }) => commentsService.updateComment(commentId, input).then((data) => ({ ...data, fileId, shapeId })),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: commentsKeys.list(data.fileId),
      })
      queryClient.invalidateQueries({
        queryKey: commentsKeys.detail(data.id),
      })
      if (data.shapeId) {
        queryClient.invalidateQueries({
          queryKey: commentsKeys.byShape(data.shapeId),
        })
      }
    },
  })
}

export const useDeleteComment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      commentId,
      fileId,
      shapeId,
    }: {
      commentId: string
      fileId: string
      shapeId?: string
    }) => commentsService.deleteComment(commentId).then(() => ({ fileId, shapeId })),
    onSuccess: ({ fileId, shapeId }) => {
      queryClient.invalidateQueries({
        queryKey: commentsKeys.list(fileId),
      })
      if (shapeId) {
        queryClient.invalidateQueries({
          queryKey: commentsKeys.byShape(shapeId),
        })
      }
    },
  })
}
