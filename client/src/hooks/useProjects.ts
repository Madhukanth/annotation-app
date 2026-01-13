import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as projectsService from '@/services/supabase/projects.service'
import type { UpdateProjectInput } from '@/services/supabase/projects.service'

export const projectsKeys = {
  all: ['projects'] as const,
  lists: () => [...projectsKeys.all, 'list'] as const,
  list: (orgId: string) => [...projectsKeys.lists(), orgId] as const,
  byUser: (userId: string) => [...projectsKeys.all, 'byUser', userId] as const,
  details: () => [...projectsKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectsKeys.details(), id] as const,
}

export const useProjects = (orgId: string) => {
  return useQuery({
    queryKey: projectsKeys.list(orgId),
    queryFn: () => projectsService.getProjects(orgId),
    enabled: !!orgId,
  })
}

export const useProjectsByUser = (userId: string) => {
  return useQuery({
    queryKey: projectsKeys.byUser(userId),
    queryFn: () => projectsService.getProjectsByUser(userId),
    enabled: !!userId,
  })
}

export const useProject = (projectId: string) => {
  return useQuery({
    queryKey: projectsKeys.detail(projectId),
    queryFn: () => projectsService.getProjectById(projectId),
    enabled: !!projectId,
  })
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: UpdateProjectInput }) =>
      projectsService.updateProject(projectId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: projectsKeys.detail(data.id),
      })
      queryClient.invalidateQueries({
        queryKey: projectsKeys.list(data.org_id),
      })
    },
  })
}

export const useDeleteProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ projectId, orgId }: { projectId: string; orgId: string }) =>
      projectsService.deleteProject(projectId).then(() => orgId),
    onSuccess: (orgId) => {
      queryClient.invalidateQueries({
        queryKey: projectsKeys.list(orgId),
      })
    },
  })
}

export const useAddProjectMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      userId,
      role,
    }: {
      projectId: string
      userId: string
      role: 'datamanager' | 'reviewer' | 'annotator'
    }) => projectsService.addProjectMember(projectId, userId, role).then(() => projectId),
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({
        queryKey: projectsKeys.detail(projectId),
      })
    },
  })
}

export const useRemoveProjectMember = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      userId,
      role,
    }: {
      projectId: string
      userId: string
      role: 'datamanager' | 'reviewer' | 'annotator'
    }) => projectsService.removeProjectMember(projectId, userId, role).then(() => projectId),
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({
        queryKey: projectsKeys.detail(projectId),
      })
    },
  })
}
