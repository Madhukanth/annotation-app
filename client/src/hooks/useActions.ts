import { useMutation, useQueryClient } from '@tanstack/react-query'
import * as actionsService from '@/services/supabase/actions.service'
import type { CreateActionInput } from '@/services/supabase/actions.service'
import { filesKeys } from './useFiles'

export const actionsKeys = {
  all: ['actions'] as const,
  lists: () => [...actionsKeys.all, 'list'] as const,
  list: (projectId: string) => [...actionsKeys.lists(), projectId] as const,
  byFile: (fileId: string) => [...actionsKeys.all, 'file', fileId] as const,
}

export const useCreateAction = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateActionInput) => actionsService.createAction(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: actionsKeys.list(data.project_id),
      })
      queryClient.invalidateQueries({
        queryKey: actionsKeys.byFile(data.file_id),
      })
      // Also invalidate files as actions may affect file state
      queryClient.invalidateQueries({
        queryKey: filesKeys.lists(),
      })
    },
  })
}
