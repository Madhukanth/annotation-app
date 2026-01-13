import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as invitationsService from '@/services/supabase/invitations.service'
import type { CreateInvitationInput } from '@/services/supabase/invitations.service'
import { projectsKeys } from './useProjects'

export const invitationsKeys = {
  all: ['invitations'] as const,
  lists: () => [...invitationsKeys.all, 'list'] as const,
  list: (projectId: string) => [...invitationsKeys.lists(), projectId] as const,
  byUser: (userId: string) => [...invitationsKeys.all, 'byUser', userId] as const,
  details: () => [...invitationsKeys.all, 'detail'] as const,
  detail: (id: string) => [...invitationsKeys.details(), id] as const,
}

export const useInvitations = (projectId: string) => {
  return useQuery({
    queryKey: invitationsKeys.list(projectId),
    queryFn: () => invitationsService.getInvitations(projectId),
    enabled: !!projectId,
  })
}

export const useUserInvitations = (userId: string) => {
  return useQuery({
    queryKey: invitationsKeys.byUser(userId),
    queryFn: () => invitationsService.getInvitationsByUser(userId),
    enabled: !!userId,
  })
}

export const useInvitation = (invitationId: string) => {
  return useQuery({
    queryKey: invitationsKeys.detail(invitationId),
    queryFn: () => invitationsService.getInvitationById(invitationId),
    enabled: !!invitationId,
  })
}

export const useCreateInvitation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateInvitationInput) => invitationsService.createInvitation(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: invitationsKeys.list(data.project_id),
      })
    },
  })
}

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => invitationsService.acceptInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: invitationsKeys.all,
      })
      queryClient.invalidateQueries({
        queryKey: projectsKeys.lists(),
      })
    },
  })
}

export const useDeclineInvitation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (invitationId: string) => invitationsService.declineInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: invitationsKeys.all,
      })
    },
  })
}

export const useDeleteInvitation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ invitationId, projectId }: { invitationId: string; projectId: string }) =>
      invitationsService.deleteInvitation(invitationId).then(() => projectId),
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({
        queryKey: invitationsKeys.list(projectId),
      })
    },
  })
}
