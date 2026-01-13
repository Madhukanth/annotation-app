import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as shapesService from '@/services/supabase/shapes.service'
import type { CreateShapeInput, UpdateShapeInput } from '@/services/supabase/shapes.service'

export const shapesKeys = {
  all: ['shapes'] as const,
  lists: () => [...shapesKeys.all, 'list'] as const,
  list: (fileId: string) => [...shapesKeys.lists(), fileId] as const,
  details: () => [...shapesKeys.all, 'detail'] as const,
  detail: (id: string) => [...shapesKeys.details(), id] as const,
}

export const useShapes = (fileId: string) => {
  return useQuery({
    queryKey: shapesKeys.list(fileId),
    queryFn: () => shapesService.getShapes(fileId),
    enabled: !!fileId,
  })
}

export const useShape = (shapeId: string) => {
  return useQuery({
    queryKey: shapesKeys.detail(shapeId),
    queryFn: () => shapesService.getShapeById(shapeId),
    enabled: !!shapeId,
  })
}

export const useCreateShape = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateShapeInput) => shapesService.createShape(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: shapesKeys.list(data.file_id),
      })
    },
  })
}

export const useUpdateShape = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ shapeId, input, fileId }: { shapeId: string; input: UpdateShapeInput; fileId: string }) =>
      shapesService.updateShape(shapeId, input).then((data) => ({ ...data, fileId })),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: shapesKeys.list(data.fileId),
      })
      queryClient.invalidateQueries({
        queryKey: shapesKeys.detail(data.id),
      })
    },
  })
}

export const useDeleteShape = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ shapeId, fileId }: { shapeId: string; fileId: string }) =>
      shapesService.deleteShape(shapeId).then(() => fileId),
    onSuccess: (fileId) => {
      queryClient.invalidateQueries({
        queryKey: shapesKeys.list(fileId),
      })
    },
  })
}
