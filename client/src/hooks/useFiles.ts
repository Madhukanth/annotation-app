import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import * as filesService from '@/services/supabase/files.service'
import type { FilesFilter, UpdateFileInput } from '@/services/supabase/files.service'

export const filesKeys = {
  all: ['files'] as const,
  lists: () => [...filesKeys.all, 'list'] as const,
  list: (projectId: string, filters?: FilesFilter) => [...filesKeys.lists(), projectId, filters] as const,
  infinite: (projectId: string, filters?: FilesFilter) => [...filesKeys.all, 'infinite', projectId, filters] as const,
  counts: () => [...filesKeys.all, 'count'] as const,
  count: (projectId: string, filters?: FilesFilter) => [...filesKeys.counts(), projectId, filters] as const,
  details: () => [...filesKeys.all, 'detail'] as const,
  detail: (id: string) => [...filesKeys.details(), id] as const,
  next: (projectId: string, annotatorId?: string) => [...filesKeys.all, 'next', projectId, annotatorId] as const,
}

export const useFiles = (projectId: string, skip: number = 0, limit: number = 50, filters?: FilesFilter) => {
  return useQuery({
    queryKey: filesKeys.list(projectId, filters),
    queryFn: () => filesService.getFiles(projectId, skip, limit, filters),
    enabled: !!projectId,
  })
}

export const useInfiniteFiles = (projectId: string, limit: number = 50, filters?: FilesFilter) => {
  return useInfiniteQuery(
    filesKeys.infinite(projectId, filters),
    ({ pageParam = 0 }) => filesService.getFiles(projectId, pageParam, limit, filters),
    {
      getNextPageParam: (lastPage, allPages) => {
        if (lastPage.length < limit) return undefined
        return allPages.length * limit
      },
      enabled: !!projectId,
    }
  )
}

export const useFile = (fileId: string) => {
  return useQuery({
    queryKey: filesKeys.detail(fileId),
    queryFn: () => filesService.getFileById(fileId),
    enabled: !!fileId,
  })
}

export const useFilesCount = (projectId: string, filters?: FilesFilter) => {
  return useQuery({
    queryKey: filesKeys.count(projectId, filters),
    queryFn: () => filesService.getFilesCount(projectId, filters),
    enabled: !!projectId,
  })
}

export const useNextFile = (projectId: string, currentFileId?: string, annotatorId?: string) => {
  return useQuery({
    queryKey: filesKeys.next(projectId, annotatorId),
    queryFn: () => filesService.getNextFile(projectId, currentFileId, annotatorId),
    enabled: !!projectId,
  })
}

export const useUpdateFile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileId, input }: { fileId: string; input: UpdateFileInput }) =>
      filesService.updateFile(fileId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: filesKeys.detail(data.id),
      })
      queryClient.invalidateQueries({
        queryKey: filesKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: filesKeys.counts(),
      })
    },
  })
}

export const useUpdateFileTags = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileId, tagIds, projectId }: { fileId: string; tagIds: string[]; projectId: string }) =>
      filesService.updateFileTags(fileId, tagIds).then(() => ({ fileId, projectId })),
    onSuccess: ({ fileId }) => {
      queryClient.invalidateQueries({
        queryKey: filesKeys.detail(fileId),
      })
      queryClient.invalidateQueries({
        queryKey: filesKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: filesKeys.counts(),
      })
    },
  })
}

export const useAssignFiles = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      fileIds,
      annotatorId,
      projectId,
    }: {
      fileIds: string[]
      annotatorId: string
      projectId: string
    }) => filesService.assignFilesToAnnotator(fileIds, annotatorId).then(() => projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: filesKeys.lists(),
      })
    },
  })
}

export const useUnassignFiles = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileIds, projectId }: { fileIds: string[]; projectId: string }) =>
      filesService.unassignFiles(fileIds).then(() => projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: filesKeys.lists(),
      })
    },
  })
}

export const useDeleteFile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (fileId: string) => filesService.deleteFile(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: filesKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: filesKeys.counts(),
      })
    },
  })
}

export const useUpdateMultipleFileTags = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ fileIds, tagIds }: { fileIds: string[]; tagIds: string[] }) =>
      filesService.updateMultipleFileTags(fileIds, tagIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: filesKeys.lists(),
      })
      queryClient.invalidateQueries({
        queryKey: filesKeys.counts(),
      })
    },
  })
}
