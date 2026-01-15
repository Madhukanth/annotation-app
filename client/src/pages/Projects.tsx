import { FC, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Upload, RefreshCw, Folder } from 'lucide-react'

import { syncProject } from '@renderer/helpers/axiosRequests'
import { useOrgStore } from '@renderer/store/organization.store'
import { useUserStore } from '@renderer/store/user.store'
import { Button } from '@/components/ui/button'
import { useProjectStore } from '@renderer/store/project.store'
import { errorNotification, successNotification } from '@/components/ui/Notification'
import Pagination from '@/components/ui/Pagination'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import ProjectThumbnail from '@/components/cards/ProjectThumbnail'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useSearchParams, Link } from 'react-router-dom'
import { useDeleteProject, projectsKeys } from '@/hooks/useProjects'
import type { ProjectListItem } from '@/services/supabase/projects.service'
import { projectsService } from '@/services/supabase'

const Projects: FC = () => {
  const [, setSearchParams] = useSearchParams()
  const selectedOrg = useOrgStore((s) => s.selectedOrg)
  const user = useUserStore((s) => s.user)
  const setProjects = useProjectStore((s) => s.setProjects)
  const updateProject = useProjectStore((s) => s.updateProject)
  const currentPage = useProjectStore((s) => s.currentPage)
  const setCurrentPage = useProjectStore((s) => s.setCurrentPage)

  const [delProject, setDelProject] = useState<ProjectListItem | null>(null)

  const queryClient = useQueryClient()
  const limit = 20

  const { data: projects = [], isFetching } = useQuery({
    queryKey: projectsKeys.list(selectedOrg || ''),
    queryFn: () => projectsService.getProjects(selectedOrg || ''),
    enabled: !!selectedOrg,
    initialData: []
  })

  // Client-side pagination
  const totalPages = Math.ceil(projects.length / limit)
  const paginatedProjects = projects.slice(currentPage * limit, (currentPage + 1) * limit)

  const deleteProjectMutation = useDeleteProject()

  const handleDeleteProject = (projectId: string) => {
    if (!selectedOrg) return
    deleteProjectMutation.mutate(
      { projectId, orgId: selectedOrg },
      {
        onSuccess: () => {
          successNotification('Project deleted successfully')
          setDelProject(null)
        },
        onError: () => {
          errorNotification('Failed to delete project')
        }
      }
    )
  }

  // Sync project - this still needs to go through the server for storage access
  const { mutate: syncProjectMutate } = useMutation({
    mutationFn: syncProject
  })

  useEffect(() => {
    if (projects.length > 0) {
      // Transform to match old ProjectType format for the store
      const transformedProjects = projects.map((p) => ({
        id: p.id,
        name: p.name,
        orgId: p.org_id,
        dataManagers: p.dataManagerIds,
        reviewers: [] as string[],
        annotators: [] as string[],
        instructions: p.instructions || '',
        createdAt: p.created_at || '',
        modifiedAt: p.updated_at || '',
        thumbnail: p.thumbnail || '',
        storage: p.storage,
        taskType: p.task_type,
        defaultClassId: p.default_class_id || null,
        isSyncing: p.is_syncing,
        syncedAt: p.synced_at ? new Date(p.synced_at) : new Date()
      }))
      setProjects(transformedProjects)
    }
  }, [projects, setProjects])

  const handleSync = (projectId: string) => {
    queryClient.setQueryData(
      projectsKeys.list(selectedOrg!),
      (oldData: ProjectListItem[] | undefined) => {
        if (!oldData) return oldData

        return oldData.map((p) => {
          if (p.id === projectId) {
            return { ...p, is_syncing: true }
          }
          return p
        })
      }
    )
    updateProject(projectId, { isSyncing: true })
    syncProjectMutate({ orgId: selectedOrg!, projectId })
  }

  return (
    <>
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!delProject} onOpenChange={() => setDelProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{delProject?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelProject(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteProjectMutation.isLoading}
              onClick={() => delProject && handleDeleteProject(delProject.id)}
            >
              {deleteProjectMutation.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Projects</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your annotation projects
            </p>
          </div>

          {user?.role !== 'user' && selectedOrg && (
            <Button asChild>
              <Link to={`/orgs/${selectedOrg}/projects/add`}>
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Link>
            </Button>
          )}
        </div>

        {/* Empty State */}
        {paginatedProjects.length === 0 && !isFetching && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Folder className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">No projects yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Create your first project to get started
              </p>
              {user?.role !== 'user' && selectedOrg && (
                <Button asChild>
                  <Link to={`/orgs/${selectedOrg}/projects/add`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Loading Skeletons */}
        {isFetching && paginatedProjects.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full rounded-none" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-9 w-16" />
                    <Skeleton className="h-9 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedProjects.map((project) => {
            let isAdmin = false
            if (user) {
              isAdmin = project.dataManagerIds.includes(user.id)
            }

            // Transform for ProjectThumbnail component
            const projectForThumbnail = {
              id: project.id,
              name: project.name,
              orgId: project.org_id,
              dataManagers: project.dataManagerIds,
              reviewers: [] as string[],
              annotators: [] as string[],
              instructions: project.instructions || '',
              createdAt: project.created_at || '',
              modifiedAt: project.updated_at || '',
              thumbnail: project.thumbnail || '',
              storage: project.storage,
              taskType: project.task_type,
              defaultClassId: project.default_class_id || null,
              isSyncing: project.is_syncing,
              syncedAt: project.synced_at ? new Date(project.synced_at) : new Date()
            }

            return (
              <Card 
                key={project.id} 
                className="overflow-hidden group hover:shadow-lg transition-all duration-200"
              >
                {/* Thumbnail */}
                {project.thumbnail ? (
                  <ProjectThumbnail project={projectForThumbnail} />
                ) : (
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Folder className="h-12 w-12 text-primary/40" />
                  </div>
                )}

                {/* Content */}
                <CardContent className="p-4">
                  <h3 className="font-medium text-foreground truncate mb-1">
                    {project.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {project.created_at ? new Date(project.created_at).toLocaleDateString() : ''}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last sync: {new Date(project.synced_at || project.created_at || Date.now()).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4">
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        to={`/orgs/${selectedOrg}/projects/${project.id}/dashboard?projectSkip=${
                          currentPage * limit
                        }&projectLimit=${limit}`}
                      >
                        View
                      </Link>
                    </Button>

                    {isAdmin && (
                      <>
                        {project.storage === 'default' ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/orgs/${selectedOrg}/projects/${project.id}/edit`}>
                              <Upload className="h-3.5 w-3.5 mr-1" />
                              Upload
                            </Link>
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={project.is_syncing}
                            onClick={() => handleSync(project.id)}
                          >
                            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${project.is_syncing ? 'animate-spin' : ''}`} />
                            {project.is_syncing ? 'Syncing' : 'Sync'}
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                          onClick={() => setDelProject(project)}
                          disabled={deleteProjectMutation.isLoading}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            className="mt-6"
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={({ selected }) => {
              setCurrentPage(selected)
              setSearchParams({
                projectSkip: (selected * limit).toString(),
                projectLimit: limit.toString()
              })
            }}
          />
        )}
      </div>
    </>
  )
}
export default Projects
