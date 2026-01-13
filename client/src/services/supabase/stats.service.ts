import { supabase } from '@/lib/supabase'

export type ProjectBasicInfo = {
  files: number
  completed: number
  skipped: number
  remaining: number
}

export type UserStats = {
  start: string
  end: string
  completed: number
  skipped: number
}

export type ProjectUserStats = {
  userId: string
  userName: string
  assignedCount: number
  completedCount: number
  skippedCount: number
  remainingCount: number
}

export const getProjectBasicInfo = async (projectId: string): Promise<ProjectBasicInfo> => {
  const [totalResult, completedResult, skippedResult] = await Promise.all([
    supabase
      .from('files')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId),
    supabase
      .from('files')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('complete', true),
    supabase
      .from('files')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('skipped', true),
  ])

  const total = totalResult.count || 0
  const completed = completedResult.count || 0
  const skipped = skippedResult.count || 0

  return {
    files: total,
    completed,
    skipped,
    remaining: total - completed - skipped,
  }
}

export const getUserStats = async (
  projectId: string,
  userId: string,
  lastDays: number = 7
): Promise<UserStats[]> => {
  const stats: UserStats[] = []
  const now = new Date()

  for (let i = lastDays - 1; i >= 0; i--) {
    const dayStart = new Date(now)
    dayStart.setDate(dayStart.getDate() - i)
    dayStart.setHours(0, 0, 0, 0)

    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)

    const [completedResult, skippedResult] = await Promise.all([
      supabase
        .from('files')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('annotator_id', userId)
        .eq('complete', true)
        .gte('completed_at', dayStart.toISOString())
        .lte('completed_at', dayEnd.toISOString()),
      supabase
        .from('files')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('annotator_id', userId)
        .eq('skipped', true)
        .gte('skipped_at', dayStart.toISOString())
        .lte('skipped_at', dayEnd.toISOString()),
    ])

    stats.push({
      start: dayStart.toISOString(),
      end: dayEnd.toISOString(),
      completed: completedResult.count || 0,
      skipped: skippedResult.count || 0,
    })
  }

  return stats
}

export const getProjectStats = async (projectId: string): Promise<ProjectUserStats[]> => {
  // Get all annotators assigned to files in this project
  const { data: files, error } = await supabase
    .from('files')
    .select('annotator_id, complete, skipped, annotator:users!files_annotator_id_fkey(id, name)')
    .eq('project_id', projectId)
    .not('annotator_id', 'is', null)

  if (error) {
    console.error('Error fetching project stats:', error)
    throw error
  }

  // Group by annotator
  const statsMap = new Map<string, ProjectUserStats>()

  files?.forEach((file) => {
    if (!file.annotator_id || !file.annotator) return

    const annotator = file.annotator as unknown as { id: string; name: string }

    if (!statsMap.has(file.annotator_id)) {
      statsMap.set(file.annotator_id, {
        userId: file.annotator_id,
        userName: annotator.name,
        assignedCount: 0,
        completedCount: 0,
        skippedCount: 0,
        remainingCount: 0,
      })
    }

    const stat = statsMap.get(file.annotator_id)!
    stat.assignedCount++
    if (file.complete) {
      stat.completedCount++
    } else if (file.skipped) {
      stat.skippedCount++
    } else {
      stat.remainingCount++
    }
  })

  return Array.from(statsMap.values())
}
