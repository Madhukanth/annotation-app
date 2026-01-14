import { FC, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus } from 'react-icons/fi'

import { syncProject } from '@renderer/helpers/axiosRequests'
import { useOrgStore } from '@renderer/store/organization.store'
import { useUserStore } from '@renderer/store/user.store'
import Button from '@/components/ui/Button'
import OutlineButton from '@/components/ui/OutlineButton'
import { useProjectStore } from '@renderer/store/project.store'
import { errorNotification, successNotification } from '@/components/ui/Notification'
import Pagination from '@/components/ui/Pagination'
import CardSkeleton from '@/components/ui/CardSkeleton'
import ProjectThumbnail from '@/components/cards/ProjectThumbnail'
import CustomModal from '@/components/ui/CustomModal'
import ConfirmDelete from '@/components/ui/ConfirmDelete'
import { useSearchParams } from 'react-router-dom'
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
      {!!delProject && (
        <CustomModal isOpen closeModal={() => setDelProject(null)}>
          <ConfirmDelete
            name={`project "${delProject.name}"`}
            loading={deleteProjectMutation.isLoading}
            onCancel={() => setDelProject(null)}
            onDelete={() => handleDeleteProject(delProject.id)}
          />
        </CustomModal>
      )}

      <div className="grid grid-cols-1 h-full w-full px-3" style={{ gridTemplateRows: '70px 1fr' }}>
        <div className="pb-4 flex justify-between items-center">
          <p className="text-2xl">Projects</p>

          {user?.role !== 'user' && selectedOrg && (
            <Button
              className="flex items-center rounded-3xl"
              link
              to={`/orgs/${selectedOrg}/projects/add`}
            >
              <FiPlus color="white" size={20} className="mr-2" />
              Add Project
            </Button>
          )}
        </div>

        {paginatedProjects.length === 0 && !isFetching && (
          <div className="flex justify-center items-center text-2xl">
            <p>No projects</p>
          </div>
        )}

        {isFetching && paginatedProjects.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max gap-6 overflow-scroll">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max gap-6 overflow-scroll">
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
              <div
                key={project.id}
                className="w-full border border-font-0.14 rounded-lg bg-white h-fit"
              >
                {project.thumbnail ? (
                  <ProjectThumbnail project={projectForThumbnail} />
                ) : (
                  <div className="h-52 object-cover w-full rounded-t-md bg-black"></div>
                )}

                <div className="py-2 px-4 pb-4">
                  <p className="text-lg text-nowrap overflow-hidden text-ellipsis">
                    {project.name}
                  </p>

                  <p className="text-sm opacity-50">
                    {project.created_at ? new Date(project.created_at).toDateString() : ''}
                  </p>

                  <p className="text-xs opacity-50 mt-2">
                    Last sync:{' '}
                    {new Date(project.synced_at || project.created_at || Date.now()).toDateString()}
                  </p>

                  <div className="flex items-center mt-4">
                    <OutlineButton
                      link
                      to={`/orgs/${selectedOrg}/projects/${project.id}/dashboard?projectSkip=${
                        currentPage * limit
                      }&projectLimit=${limit}`}
                      className="mr-2"
                    >
                      View
                    </OutlineButton>

                    {isAdmin && (
                      <>
                        {project.storage === 'default' ? (
                          <OutlineButton
                            link
                            to={`/orgs/${selectedOrg}/projects/${project.id}/edit`}
                            className="mr-2"
                          >
                            Upload
                          </OutlineButton>
                        ) : (
                          <OutlineButton
                            disabled={project.is_syncing}
                            onClick={() => {
                              handleSync(project.id)
                            }}
                          >
                            {project.is_syncing ? 'Syncing...' : 'Sync'}
                          </OutlineButton>
                        )}
                      </>
                    )}

                    <div className="flex-grow" />

                    {isAdmin && (
                      <OutlineButton
                        onClick={() => setDelProject(project)}
                        disabled={deleteProjectMutation.isLoading}
                        className="text-red-500"
                      >
                        Delete
                      </OutlineButton>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {totalPages > 1 && (
          <Pagination
            className="my-5"
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
