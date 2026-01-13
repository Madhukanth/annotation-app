import { FC, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import ImageAnnotate from './ImageAnnotate/ImageAnnotate'
import VideoAnnotate from './VideoAnnotate/VideoAnnotate'
import { HEADER_HEIGHT } from '@renderer/constants'
import HeaderLayout from '@renderer/components/Annotate/HeaderLayout'
import { useOrgStore } from '@renderer/store/organization.store'
import { useFilesStore } from '@renderer/store/files.store'
import { useProjectStore } from '@renderer/store/project.store'
import Loader from '@renderer/components/common/Loader'
import { errorNotification, successNotification } from '@renderer/components/common/Notification'
import { useProjects } from '@/hooks/useProjects'
import { filesService } from '@/services/supabase'
import type { FileWithMetadata } from '@/services/supabase/files.service'
import type FileType from '@renderer/models/File.model'

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

    const fetchMoreFiles = async (): Promise<{ files: FileWithMetadata[]; count: number }> => {
      const filters: Parameters<typeof filesService.getFilesWithCount>[3] = {
        ...(complete !== null && { complete: complete === 'true' }),
        ...(completedAfter && { completedAfter }),
        ...(skipped !== null && { skipped: skipped === 'true' }),
        ...(hasShapes !== null && { hasShapes: hasShapes === 'true' }),
        ...(skippedAfter && { skippedAfter }),
        ...(annotator && { annotatorId: annotator }),
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
    if (!projectsData || projectsData.length === 0) return
    // Transform to legacy format
    const transformedProjects = projectsData.map((p) => ({
      id: p.id,
      name: p.name,
      orgId: p.org_id,
      dataManagers: p.dataManagerIds,
      reviewers: [] as string[],
      annotators: [] as string[],
      instructions: p.instructions || '',
      createdAt: p.created_at || '',
      modifiedAt: p.updated_at || '',
      thumbnail: '',
      storage: p.storage,
      taskType: p.task_type,
      defaultClassId: p.default_class_id || null,
      isSyncing: p.is_syncing,
      syncedAt: p.synced_at ? new Date(p.synced_at) : new Date()
    }))
    setProjects(transformedProjects)
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

// Helper function to transform Supabase file to legacy format
function transformFileToLegacy(file: FileWithMetadata): FileType {
  // Transform shapes from Supabase format to legacy format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformMetadata = (): any => {
    if (!file.metadata) {
      return {
        rectangles: [],
        circles: [],
        polygons: [],
        faces: [],
        lines: []
      }
    }

    // For images, metadata contains arrays of shapes
    // For videos, metadata contains objects with frame keys
    if (file.type === 'image') {
      const meta = file.metadata as {
        rectangles: unknown[]
        circles: unknown[]
        polygons: unknown[]
        faces: unknown[]
        lines: unknown[]
      }
      return {
        rectangles: (meta.rectangles || []).map(transformShape),
        circles: (meta.circles || []).map(transformShape),
        polygons: (meta.polygons || []).map(transformShape),
        faces: (meta.faces || []).map(transformShape),
        lines: (meta.lines || []).map(transformShape)
      }
    } else {
      // Video metadata has shapes organized by frame
      const meta = file.metadata as {
        rectangles: { [frame: number]: unknown[] }
        circles: { [frame: number]: unknown[] }
        polygons: { [frame: number]: unknown[] }
        faces: { [frame: number]: unknown[] }
        lines: { [frame: number]: unknown[] }
      }
      return {
        rectangles: transformVideoShapes(meta.rectangles || {}),
        circles: transformVideoShapes(meta.circles || {}),
        polygons: transformVideoShapes(meta.polygons || {}),
        faces: transformVideoShapes(meta.faces || {}),
        lines: transformVideoShapes(meta.lines || {})
      }
    }
  }

  // Transform a single shape from Supabase snake_case to camelCase
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformShape = (shape: any) => ({
    id: shape.id,
    name: shape.name,
    type: shape.type,
    notes: shape.notes,
    stroke: shape.stroke,
    strokeWidth: shape.stroke_width,
    x: shape.x,
    y: shape.y,
    height: shape.height,
    width: shape.width,
    points: shape.points,
    classId: shape.class_id,
    text: shape.text_field,
    ID: shape.id_field,
    attribute: shape.attribute,
    atFrame: shape.at_frame,
    orgId: shape.org_id,
    projectId: shape.project_id,
    fileId: shape.file_id,
    closed: shape.closed ?? false // Required for FaceType
  })

  // Transform video shapes (organized by frame) to legacy format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformVideoShapes = (frameShapes: { [frame: number]: unknown[] }): { [frame: number]: any[] } => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: { [frame: number]: any[] } = {}
    for (const [frame, shapes] of Object.entries(frameShapes)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result[Number(frame)] = (shapes as any[]).map(transformShape)
    }
    return result
  }

  return {
    id: file.id,
    originalName: file.original_name || '',
    relativePath: file.relative_path || '',
    name: file.name || '',
    orgId: file.org_id,
    projectId: file.project_id,
    url: file.url || '',
    type: (file.type || 'image') as 'image' | 'video',
    metadata: transformMetadata(),
    annotators: file.annotator_id ? [file.annotator_id] : [],
    reviewers: [],
    createdAt: file.created_at || '',
    complete: file.complete,
    stageScale: 1,
    storedIn: file.stored_in,
    tags: (file.tags || []).map((t: { id: string; name: string; color: string }) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      attributes: [],
      text: false,
      ID: false,
      orgId: file.org_id,
      projectId: file.project_id,
      notes: '',
      createdAt: '',
      modifiedAt: ''
    })),
    dbIndex: file.dbIndex || 0,
    skipped: file.skipped,
    fps: file.fps,
    totalFrames: file.total_frames,
    duration: file.duration
  }
}

export default AnnotatePage
