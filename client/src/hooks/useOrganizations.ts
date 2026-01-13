import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as organizationsService from '@/services/supabase/organizations.service'

export const organizationsKeys = {
  all: ['organizations'] as const,
  lists: () => [...organizationsKeys.all, 'list'] as const,
  list: (userId: string) => [...organizationsKeys.lists(), userId] as const,
  details: () => [...organizationsKeys.all, 'detail'] as const,
  detail: (id: string) => [...organizationsKeys.details(), id] as const,
}

export const useOrganizations = (userId: string) => {
  return useQuery({
    queryKey: organizationsKeys.list(userId),
    queryFn: () => organizationsService.getOrganizations(userId),
    enabled: !!userId,
  })
}

export const useOrganization = (orgId: string) => {
  return useQuery({
    queryKey: organizationsKeys.detail(orgId),
    queryFn: () => organizationsService.getOrganizationById(orgId),
    enabled: !!orgId,
  })
}

export const useCreateOrganization = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, orgAdminId }: { name: string; orgAdminId: string }) =>
      organizationsService.createOrganization(name, orgAdminId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationsKeys.lists(),
      })
    },
  })
}

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orgId,
      updates,
    }: {
      orgId: string
      updates: { name?: string; orgadmin_id?: string }
    }) => organizationsService.updateOrganization(orgId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: organizationsKeys.detail(data.id),
      })
      queryClient.invalidateQueries({
        queryKey: organizationsKeys.lists(),
      })
    },
  })
}

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orgId: string) => organizationsService.deleteOrganization(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: organizationsKeys.lists(),
      })
    },
  })
}
