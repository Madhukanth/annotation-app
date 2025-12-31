import { FC, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import ImageAnnotate from './ImageAnnotate/ImageAnnotate'
import VideoAnnotate from './VideoAnnotate/VideoAnnotate'
import { HEADER_HEIGHT } from '@renderer/constants'
import HeaderLayout from '@renderer/components/Annotate/HeaderLayout'
import { useOrgStore } from '@renderer/store/organization.store'
import { useFilesStore } from '@renderer/store/files.store'
import { useQuery } from '@tanstack/react-query'
import { fetchProjects, queryFetcher } from '@renderer/helpers/axiosRequests'
import { useUserStore } from '@renderer/store/user.store'
import { useProjectStore } from '@renderer/store/project.store'
import Loader from '@renderer/components/common/Loader'
import FileType from '@renderer/models/File.model'
import { errorNotification, successNotification } from '@renderer/components/common/Notification'

const AnnotatePage: FC = () => {
  const { orgid: orgId, projectid: projectId } = useParams()

  const [isInit, setIsInit] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const complete = searchParams.get('complete')
  const skip = Number(searchParams.get('skip') || 0)
  const limit = Number(searchParams.get('limit') || 1000)
  const annotator = searchParams.get('annotator')
  const skipped = searchParams.get('skipped')
  const hasShapes = searchParams.get('hasShapes')
  const completedAfter = searchParams.get('completedAfter')
  const skippedAfter = searchParams.get('skippedAfter')
  const prevSkipTo = searchParams.get('prevSkipTo')
  const projectSkip = Number(searchParams.get('projectSkip') || 0)
  const projectLimit = Number(searchParams.get('projectLimit') || 20)
  const user = useUserStore((s) => s.user)
  const setProjects = useProjectStore((s) => s.setProjects)
  const appendFiles = useFilesStore((s) => s.appendFiles)
  const selectedFile = useFilesStore((s) => s.selectedFile)
  const files = useFilesStore((s) => s.files)
  const setSelectedFile = useFilesStore((s) => s.setSelectedFile)
  const setCount = useFilesStore((s) => s.setCount)
  const setFiles = useFilesStore((s) => s.setFiles)
  const setSelectedOrg = useOrgStore((s) => s.setSelectedOrg)
  const [isFetching, setIsFetching] = useState(true)
  const isReviewPage = location.pathname.startsWith('/review')
  const keepCount = isReviewPage ? 0 : 10

  const { data: projectsData, refetch: refetchProjects } = useQuery(
    ['projects', { orgId: orgId!, userId: user!.id, limit: projectLimit, skip: projectSkip }],
    fetchProjects,
    { enabled: false }
  )

  useEffect(() => {
    setFiles([])
    refetchProjects()
    setIsInit(true)

    return () => {
      setSelectedFile(null)
    }
  }, [])

  useEffect(() => {
    if (!isInit) return

    const fetchMoreFiles = (): Promise<{ files: FileType[]; count: number }> => {
      return queryFetcher(`/orgs/${orgId}/projects/${projectId}/files`, {
        skip: skip.toString(),
        limit: limit.toString(),
        ...(complete && { complete: complete.toString() }),
        ...(completedAfter && { completedAfter: new Date(completedAfter).toISOString() }),
        ...(skipped && { skipped: skipped.toString() }),
        ...(hasShapes && { hasShapes: hasShapes.toString() }),
        ...(skippedAfter && { skippedAfter: new Date(skippedAfter).toISOString() }),
        ...(annotator && { annotator }),
        ...(keepCount > 0 &&
          files.length > 0 && {
            skipFileIds: files
              .slice(-keepCount)
              .map((f) => f.id)
              .join(',')
          }),
        assign: isReviewPage ? 'false' : 'true'
      })
    }

    const handleFetchMoreFiles = async () => {
      setIsFetching(true)

      try {
        const fetchData = await fetchMoreFiles()
        if (fetchData.files.length > 0) {
          let fileToSelect = fetchData.files[0]

          if (prevSkipTo) {
            fileToSelect = fetchData.files[fetchData.files.length - 1]

            const skipTo = Number(prevSkipTo)
            if (skip < limit && fetchData.files.length >= skipTo) {
              fileToSelect = fetchData.files[skipTo - 1]
            }
          }

          setSelectedFile(fileToSelect)
          appendFiles(fetchData.files, keepCount)
        } else {
          successNotification(`No more files to ${isReviewPage ? 'review' : 'annotate'}`)
          if (orgId && projectId) {
            navigate(
              `/orgs/${orgId}/projects/${projectId}/dashboard?projectSkip=${projectSkip}&projectLimit=${projectLimit}`
            )
          }
        }

        setCount(fetchData.count)
      } catch (err) {
        errorNotification('Failed fetch next set of images')
      } finally {
        setIsFetching(false)
      }
    }

    if (!selectedFile) {
      handleFetchMoreFiles()
    } else {
      const thumbnail = document.getElementById(`thumb-${selectedFile.id}`)
      if (thumbnail) {
        thumbnail.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
      }
    }
  }, [selectedFile, isInit])

  useEffect(() => {
    if (orgId) {
      setSelectedOrg(orgId)
    }
  }, [orgId])

  useEffect(() => {
    if (!projectsData) return
    setProjects(projectsData.projects)
  }, [projectsData])

  return (
    <div className="h-screen w-screen">
      {/* Header */}
      <div style={{ height: `${HEADER_HEIGHT}px` }}>
        <HeaderLayout />
      </div>

      {isFetching ? (
        <Loader />
      ) : selectedFile ? (
        selectedFile.type === 'image' ? (
          <ImageAnnotate />
        ) : (
          <VideoAnnotate />
        )
      ) : (
        <Loader />
      )}
    </div>
  )
}

export default AnnotatePage
