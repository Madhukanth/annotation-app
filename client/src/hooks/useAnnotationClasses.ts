import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as annotationClassesService from '@/services/supabase/annotationClasses.service'
import type { CreateAnnotationClassInput, UpdateAnnotationClassInput } from '@/services/supabase/annotationClasses.service'

export const annotationClassesKeys = {
  all: ['annotationClasses'] as const,
  lists: () => [...annotationClassesKeys.all, 'list'] as const,
  list: (projectId: string) => [...annotationClassesKeys.lists(), projectId] as const,
  details: () => [...annotationClassesKeys.all, 'detail'] as const,
  detail: (id: string) => [...annotationClassesKeys.details(), id] as const,
}

export const useAnnotationClasses = (projectId: string) => {
  return useQuery({
    queryKey: annotationClassesKeys.list(projectId),
    queryFn: () => annotationClassesService.getAnnotationClasses(projectId),
    enabled: !!projectId,
  })
}

export const useAnnotationClass = (classId: string) => {
  return useQuery({
    queryKey: annotationClassesKeys.detail(classId),
    queryFn: () => annotationClassesService.getAnnotationClassById(classId),
    enabled: !!classId,
  })
}

export const useCreateAnnotationClass = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateAnnotationClassInput) =>
      annotationClassesService.createAnnotationClass(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: annotationClassesKeys.list(data.project_id),
      })
    },
  })
}

export const useUpdateAnnotationClass = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ classId, input }: { classId: string; input: UpdateAnnotationClassInput }) =>
      annotationClassesService.updateAnnotationClass(classId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: annotationClassesKeys.list(data.project_id),
      })
      queryClient.invalidateQueries({
        queryKey: annotationClassesKeys.detail(data.id),
      })
    },
  })
}

export const useDeleteAnnotationClass = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ classId, projectId }: { classId: string; projectId: string }) =>
      annotationClassesService.deleteAnnotationClass(classId).then(() => projectId),
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({
        queryKey: annotationClassesKeys.list(projectId),
      })
    },
  })
}
