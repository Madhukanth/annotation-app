import { FC, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus } from 'react-icons/fi'

import { deleteProject, fetchProjects, syncProject } from '@renderer/helpers/axiosRequests'
import { useOrgStore } from '@renderer/store/organization.store'
import { useUserStore } from '@renderer/store/user.store'
import Button from '@renderer/components/common/Button'
import OutlineButton from '@renderer/components/common/OutlineButton'
import { useProjectStore } from '@renderer/store/project.store'
import { errorNotification, successNotification } from '@renderer/components/common/Notification'
import Pagination from '@renderer/components/common/Pagination'
import CardSkeleton from '@renderer/components/common/CardSkeleton'
import ProjectThumbnail from '@renderer/components/ProjectThumbnail'
import ProjectType from '@models/Project.model'
import CustomModal from '@renderer/components/common/CustomModal'
import ConfirmDelete from '@renderer/components/common/ConfirmDelete'
import { useSearchParams } from 'react-router-dom'

const Projects: FC = () => {
  const [, setSearchParams] = useSearchParams()
  const selectedOrg = useOrgStore((s) => s.selectedOrg)
  const user = useUserStore((s) => s.user)
  const setProjects = useProjectStore((s) => s.setProjects)
  const updateProject = useProjectStore((s) => s.updateProject)
  const currentPage = useProjectStore((s) => s.currentPage)
  const setCurrentPage = useProjectStore((s) => s.setCurrentPage)

  const [delProject, setDelProject] = useState<ProjectType | null>(null)

  const queryClient = useQueryClient()
  const limit = 20
  const skip = currentPage * limit
  const { data, refetch, isFetching } = useQuery(
    ['projects', { orgId: selectedOrg!, userId: user!.id, limit, skip }],
    fetchProjects,
    {
      initialData: { projects: [], count: 0 },
      enabled: !!selectedOrg && !!user
    }
  )
  const totalPages = Math.ceil(data.count / limit)

  const { mutate: deleteProjectMutate, isLoading: isDeleting } = useMutation(deleteProject, {
    onSuccess() {
      refetch()
      setDelProject(null)
    },
    onError() {
      errorNotification('Failed to delete the project')
    }
  })
  const { mutate: syncProjectMutate } = useMutation({
    mutationFn: syncProject
  })

  const handleDeleteProject = (projectId: string) => {
    if (!selectedOrg) return
    deleteProjectMutate(
      { orgId: selectedOrg, projectId },
      {
        onSuccess: () => {
          successNotification('Project deleted successfully')
        },
        onError: () => {
          errorNotification('Failed to delete project')
        }
      }
    )
  }

  useEffect(() => {
    if (data) {
      setProjects(data.projects)
    }
  }, [data.projects])

  const handleSync = (projectId: string) => {
    queryClient.setQueryData(
      ['projects', { orgId: selectedOrg!, userId: user!.id, limit, skip }],
      (oldData: { projects: ProjectType[]; count: number } | undefined) => {
        if (!oldData) return oldData

        return {
          ...oldData,
          projects: oldData.projects.map((p: ProjectType) => {
            if (p.id === projectId) {
              return { ...p, isSyncing: true }
            }

            return p
          })
        }
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
            loading={isDeleting}
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

        {data.projects.length === 0 && !isFetching && (
          <div className="flex justify-center items-center text-2xl">
            <p>No projects</p>
          </div>
        )}

        {isFetching && data.projects.length === 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max gap-6 overflow-scroll">
            <CardSkeleton />
            {/* <CardSkeleton /> */}
            {/* <CardSkeleton /> */}
            {/* <CardSkeleton /> */}
            {/* <CardSkeleton /> */}
            {/* <CardSkeleton /> */}
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max gap-6 overflow-scroll">
          {data.projects.map((project) => {
            let isAdmin = false
            if (user) {
              isAdmin = project.dataManagers.includes(user.id)
            }

            return (
              <div
                key={project.id}
                className="w-full border border-font-0.14 rounded-lg bg-white h-fit"
              >
                {project.thumbnail ? (
                  <ProjectThumbnail project={project} />
                ) : (
                  <div className="h-52 object-cover w-full rounded-t-md bg-black"></div>
                )}

                <div className="py-2 px-4 pb-4">
                  <p className="text-lg text-nowrap overflow-hidden text-ellipsis">
                    {project.name}
                  </p>

                  <p className="text-sm opacity-50">{new Date(project.createdAt).toDateString()}</p>

                  <p className="text-xs opacity-50 mt-2">
                    Last sync: {new Date(project.syncedAt || project.createdAt).toDateString()}
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
                            disabled={project.isSyncing}
                            onClick={() => {
                              handleSync(project.id)
                            }}
                          >
                            {project.isSyncing ? 'Syncing...' : 'Sync'}
                          </OutlineButton>
                        )}
                      </>
                    )}

                    <div className="flex-grow" />

                    {isAdmin && (
                      <OutlineButton
                        onClick={() => setDelProject(project)}
                        disabled={isDeleting}
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
