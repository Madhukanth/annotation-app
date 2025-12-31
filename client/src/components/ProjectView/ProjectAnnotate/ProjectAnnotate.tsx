import { FC, useEffect } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'

import { useOrgStore } from '@renderer/store/organization.store'
import AnnotateCard from './AnnotateCard'
import { deleteFile, fetchProjectFiles } from '@renderer/helpers/axiosRequests'
import { errorNotification } from '@renderer/components/common/Notification'
import Pagination from '@renderer/components/common/Pagination'
import { useFilesStore } from '@renderer/store/files.store'
import CardSkeleton from '@renderer/components/common/CardSkeleton'
import VideoAnnotateCard from './VideoAnnotateCard'
import { useUserStore } from '@renderer/store/user.store'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useProjectStore } from '@renderer/store/project.store'
import Button from '@renderer/components/common/Button'

const ProjectAnnotate: FC = () => {
  const [searchParams] = useSearchParams()
  const projectSkip = Number(searchParams.get('projectSkip') || 0)
  const projectLimit = Number(searchParams.get('projectLimit') || 20)
  const user = useUserStore((s) => s.user)
  const orgId = useOrgStore((state) => state.selectedOrg)
  const currentPage = useFilesStore((state) => state.currentPage)
  const setCurrentPage = useFilesStore((state) => state.setCurrentPage)
  const setCount = useFilesStore((state) => state.setCount)
  const setFiles = useFilesStore((state) => state.setFiles)
  const { projectid: projectId } = useParams()
  const projects = useProjectStore((s) => s.projects)
  const project = projects.find((p) => p.id === projectId)

  const limit = 20
  const skip = currentPage * limit
  const { data, refetch, isFetching } = useQuery(
    [
      'project-files',
      {
        orgId: orgId!,
        projectId: projectId!,
        skip,
        limit,
        complete: false,
        annotator: user?.id,
        skipped: false
      }
    ],
    fetchProjectFiles,
    { initialData: { files: [], count: 0 }, enabled: !!orgId && !!projectId }
  )
  const totalPages = Math.ceil(data.count / limit)

  useEffect(() => {
    setCount(data.count)
  }, [data.count])

  useEffect(() => {
    setFiles(data.files)
  }, [data.files])

  const { mutate: deleteFileMutator, isLoading: isDeleting } = useMutation(deleteFile, {
    onSuccess() {
      refetch()
    },
    onError() {
      errorNotification('Failed to delete image')
    }
  })

  const handleDeleteFile = (fileId: string) => {
    if (!orgId || !projectId) return
    deleteFileMutator({ orgId, projectId, fileId })
  }

  if (!project) {
    return <div>Project not found</div>
  }

  const gridStyle = totalPages > 1 ? '40px 1fr 60px' : '40px 1fr'

  const getUrl = () => {
    if (!orgId || !projectId || !user) return null

    const type = project.taskType === 'classification' ? 'classify' : 'annotate'
    return `/${type}/orgs/${orgId}/projects/${projectId}?limit=1000&skipped=false&complete=false&annotator=${user.id}&projectSkip=${projectSkip}&projectLimit=${projectLimit}`
  }

  const toUrl = getUrl()

  return (
    <div
      className="h-full w-full grid gap-4 overflow-hidden"
      style={{ gridTemplateRows: gridStyle }}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-xl">
          Projects {'>'} {project.name}
        </p>

        <div className="flex items-center gap-3">
          {toUrl && (
            <Link to={toUrl}>
              <Button className="py-2">Start</Button>
            </Link>
          )}
        </div>
      </div>

      {isFetching && data.files.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max h-full overflow-scroll">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      )}

      {!isFetching && data.files.length === 0 && (
        <div className="flex flex-col items-center justify-center text-gray-500">
          <p>No files to annotate</p>
          <p>Click "Start" to get images assigned</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-max h-full overflow-scroll">
        {data.files.map((file) => {
          if (file.type === 'image') {
            return (
              <AnnotateCard
                skip={currentPage * limit}
                limit={limit}
                key={file.id}
                isDeleting={isDeleting}
                image={file}
                onDelete={() => handleDeleteFile(file.id)}
                annotator={user?.id}
                skipped={false}
              />
            )
          }

          return (
            <VideoAnnotateCard
              key={file.id}
              video={file}
              isDeleting={isDeleting}
              onDelete={() => handleDeleteFile(file.id)}
            />
          )
        })}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={({ selected }) => {
            setCurrentPage(selected)
          }}
        />
      )}
    </div>
  )
}

export default ProjectAnnotate
