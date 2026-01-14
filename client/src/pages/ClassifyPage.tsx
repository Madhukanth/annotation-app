import { FC, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { HEADER_HEIGHT } from '@renderer/constants'
import HeaderLayout from '@renderer/components/Annotate/HeaderLayout'
import { useOrgStore } from '@renderer/store/organization.store'
import { useFilesStore } from '@renderer/store/files.store'
import { useProjectStore } from '@renderer/store/project.store'
import Loader from '@/components/ui/Loader'
import { errorNotification, successNotification } from '@/components/ui/Notification'
import ClassifyImage from '@/components/classification/ClassifyImage'
import { useClassifyStore } from '@renderer/store/classify.store'
import ClassifyGrid from '@/components/classification/ClassifyGrid'
import { useProjects } from '@/hooks/useProjects'
import { filesService } from '@/services/supabase'
import { transformFileToLegacy, transformProjectToLegacy } from '@/utils/transformers'

const ClassifyPage: FC = () => {
  const { orgid: orgId, projectid: projectId } = useParams()

  const [isInit, setIsInit] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const complete = searchParams.get('complete')
  const skip = Number(searchParams.get('skip') || 0)
  const limit = Number(searchParams.get('limit') || 1000)
  const annotator = searchParams.get('annotator')
  const skipped = searchParams.get('skipped')
  const completedAfter = searchParams.get('completedAfter')
  const skippedAfter = searchParams.get('skippedAfter')
  const prevSkipTo = searchParams.get('prevSkipTo')
  const tags = searchParams.get('tags')
  const projectSkip = Number(searchParams.get('projectSkip') || 0)
  const projectLimit = Number(searchParams.get('projectLimit') || 20)
  const setProjects = useProjectStore((s) => s.setProjects)
  const appendFiles = useFilesStore((s) => s.appendFiles)
  const selectedFile = useFilesStore((s) => s.selectedFile)
  const files = useFilesStore((s) => s.files)
  const setSelectedFile = useFilesStore((s) => s.setSelectedFile)
  const setCount = useFilesStore((s) => s.setCount)
  const setFiles = useFilesStore((s) => s.setFiles)
  const setSelectedOrg = useOrgStore((s) => s.setSelectedOrg)
  const [isFetching, setIsFetching] = useState(true)
  const isGrid = useClassifyStore((s) => s.isGrid)
  const isReviewPage = location.pathname.startsWith('/review')
  const keepCount = isReviewPage ? 0 : 10

  // Fetch projects using Supabase
  const { data: projectsData } = useProjects(orgId || '')

  useEffect(() => {
    setFiles([])
    setIsInit(true)

    return () => {
      setSelectedFile(null)
    }
  }, [])

  useEffect(() => {
    if (!isInit || !projectId) return

    const fetchMoreFiles = async () => {
      const filters: Parameters<typeof filesService.getFilesWithCount>[3] = {
        ...(complete !== null && { complete: complete === 'true' }),
        ...(completedAfter && { completedAfter }),
        ...(skipped !== null && { skipped: skipped === 'true' }),
        ...(skippedAfter && { skippedAfter }),
        ...(annotator && { annotatorId: annotator }),
        ...(tags && { tags: tags.split(',') }),
        ...(keepCount > 0 &&
          files.length > 0 && {
            skipFileIds: files.slice(-keepCount).map((f) => f.id)
          }),
        assign: isReviewPage ? 'false' : 'true'
      }

      return filesService.getFilesWithCount(projectId, skip, limit, filters)
    }

    const handleFetchMoreFiles = async () => {
      setIsFetching(true)

      try {
        const fetchData = await fetchMoreFiles()
        if (fetchData.files.length > 0) {
          // Transform Supabase format to legacy format
          const transformedFiles = fetchData.files.map((f) => transformFileToLegacy(f))

          let fileToSelect = transformedFiles[0]

          if (prevSkipTo) {
            fileToSelect = transformedFiles[transformedFiles.length - 1]

            const skipTo = Number(prevSkipTo)
            if (skip < limit && transformedFiles.length >= skipTo) {
              fileToSelect = transformedFiles[skipTo - 1]
            }
          }

          setSelectedFile(fileToSelect)
          appendFiles(transformedFiles, keepCount)
        } else {
          successNotification(`No more files to ${isReviewPage ? 'review' : 'classify'}`)
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
    if (!projectsData || projectsData.length === 0) return
    setProjects(projectsData.map(transformProjectToLegacy))
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
        isGrid ? (
          <ClassifyGrid />
        ) : (
          <ClassifyImage />
        )
      ) : (
        <Loader />
      )}
    </div>
  )
}

export default ClassifyPage
