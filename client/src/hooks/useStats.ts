import { useQuery } from '@tanstack/react-query'
import * as statsService from '@/services/supabase/stats.service'

export const statsKeys = {
  all: ['stats'] as const,
  projectBasicInfo: (projectId: string) => [...statsKeys.all, 'basicInfo', projectId] as const,
  userStats: (projectId: string, userId: string, lastDays: number) =>
    [...statsKeys.all, 'userStats', projectId, userId, lastDays] as const,
  projectStats: (projectId: string) => [...statsKeys.all, 'projectStats', projectId] as const,
}

export const useProjectBasicInfo = (projectId: string) => {
  return useQuery({
    queryKey: statsKeys.projectBasicInfo(projectId),
    queryFn: () => statsService.getProjectBasicInfo(projectId),
    enabled: !!projectId,
  })
}

export const useUserStats = (projectId: string, userId: string, lastDays: number = 7) => {
  return useQuery({
    queryKey: statsKeys.userStats(projectId, userId, lastDays),
    queryFn: () => statsService.getUserStats(projectId, userId, lastDays),
    enabled: !!projectId && !!userId,
  })
}

export const useProjectStats = (projectId: string) => {
  return useQuery({
    queryKey: statsKeys.projectStats(projectId),
    queryFn: () => statsService.getProjectStats(projectId),
    enabled: !!projectId,
  })
}
