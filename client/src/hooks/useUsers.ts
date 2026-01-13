import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as usersService from '@/services/supabase/users.service'
import type { UpdateUserInput } from '@/services/supabase/users.service'

export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (orgId?: string) => [...usersKeys.lists(), orgId] as const,
  search: (term: string) => [...usersKeys.all, 'search', term] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
  projectUsers: (projectId: string) => [...usersKeys.all, 'project', projectId] as const,
}

export const useUsers = (orgId?: string) => {
  return useQuery({
    queryKey: usersKeys.list(orgId),
    queryFn: () => usersService.getUsers(orgId),
  })
}

export const useUser = (userId: string) => {
  return useQuery({
    queryKey: usersKeys.detail(userId),
    queryFn: () => usersService.getUserById(userId),
    enabled: !!userId,
  })
}

export const useSearchUsers = (searchTerm: string) => {
  return useQuery({
    queryKey: usersKeys.search(searchTerm),
    queryFn: () => usersService.searchUsers(searchTerm),
    enabled: searchTerm.length >= 2,
  })
}

export const useProjectUsers = (projectId: string) => {
  return useQuery({
    queryKey: usersKeys.projectUsers(projectId),
    queryFn: () => usersService.getProjectUsers(projectId),
    enabled: !!projectId,
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UpdateUserInput }) =>
      usersService.updateUser(userId, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: usersKeys.detail(data.id),
      })
      queryClient.invalidateQueries({
        queryKey: usersKeys.lists(),
      })
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => usersService.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: usersKeys.lists(),
      })
    },
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: usersService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: usersKeys.lists(),
      })
    },
  })
}
