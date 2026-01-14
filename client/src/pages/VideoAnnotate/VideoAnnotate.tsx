import { FC, useCallback, useRef, useState } from 'react'
import { Stage } from 'react-konva'
import { Stage as StageType } from 'konva/lib/Stage'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useHotkeys } from 'react-hotkeys-hook'
import { BsFillCheckCircleFill } from 'react-icons/bs'
import { useMutation } from '@tanstack/react-query'

import { cn } from '@renderer/utils/cn'
import PolygonType from '@models/Polygon.model'
import AddNameModal from '@/components/modals/AddNameModal'
import PointType from '@models/Point.model'
import { ANNOTATIONLIST_WIDTH, ANNOTATION_TOOLBAR_WIDTH } from '@renderer/constants'
import { generateId, getStoredUrl } from '@renderer/utils/vars'
import { useFilesStore } from '@renderer/store/files.store'
import AnnotationToolbar from './AnnotationToolbar'
import AnnotateHeader from './AnnotateHeader'
import NextImage from './NextVideo'
import PrevImage from './PrevVideo'
import Shapes from './Shapes'
import AnnotationTabs from './AnnotationTabs'
import LineType from '@models/Line.model'
import { shapesService } from '@/services/supabase'
import type { ShapeType as SupabaseShapeType } from '@/lib/supabase'
import { useOrgStore } from '@renderer/store/organization.store'
import ImgSize from '@models/ImgSize.model'
import { calculateFrame } from './helpers/helpers'
import VideoControls from './VideoControls/VideoControls'
import { useUntrackedVideoStore, useVideoStore } from './store/video.store'

type TabsName = 'annotation_list' | 'comments'

const VideoAnnotate: FC = () => {
  const [selectedTab, setSelectedTab] = useState<TabsName>('annotation_list')
  const [showAddModal, setShowAddModal] = useState(false)
  const [imgSize, setImgSize] = useState<ImgSize>({
    naturalHeight: 500,
    naturalWidth: 500,
    offsetTop: 0,
    offsetLeft: 0,
    offsetHeight: 500,
    offsetWidth: 500
  })
  const [imgLoaded, setLoaded] = useState(false)

  const { projectid: projectId } = useParams()
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id
  const files = useFilesStore((s) => s.files)

  const orgId = useOrgStore((s) => s.selectedOrg)
  const { mutate: createShapeMutate } = useMutation({
    mutationFn: ({ shape }: { orgId: string; projectId: string; fileId: string; shape: Record<string, unknown> }) =>
      shapesService.createShape({
        id: shape.id as string | undefined,
        name: shape.name as string,
        type: shape.type as SupabaseShapeType,
        orgId: shape.orgId as string,
        projectId: shape.projectId as string,
        fileId: shape.fileId as string,
        classId: shape.classId as string | undefined,
        notes: shape.notes as string | undefined,
        strokeWidth: shape.strokeWidth as number | undefined,
        points: shape.points as { id: string; x: number; y: number }[] | undefined,
        textField: shape.text as string | undefined,
        idField: shape.ID as string | undefined,
        attribute: shape.attribute as string | undefined,
        atFrame: shape.atFrame as number | undefined
      })
  })

  const videoRef = useRef<HTMLVideoElement>(null)
  const newPolyIdRef = useRef<string | null>(null)
  const addPointsPolyIdRef = useRef<string | null>(null)
  const newLineIdRef = useRef<string | null>(null)
  const addPointsLineIdRef = useRef<string | null>(null)
  const stageRef = useRef<StageType | null>(null)
  const drawboardRef = useRef<HTMLDivElement>(null)

  const polygons = useVideoStore((s) => s.polygons)
  const lines = useVideoStore((s) => s.lines)
  const addLine = useVideoStore((s) => s.addLine)
  const addPointsToLine = useVideoStore((s) => s.addPointsToLine)
  const addPolygon = useVideoStore((s) => s.addPolygon)
  const addPointsToPolygon = useVideoStore((s) => s.addPointsToPolygon)

  const getAllPolygons = useVideoStore((s) => s.getAllPolygons)
  const updatePolygon = useVideoStore((s) => s.updatePolygon)
  const deletePolygon = useVideoStore((s) => s.deletePolygon)
  const getAllLines = useVideoStore((s) => s.getAllLines)
  const updateLine = useVideoStore((s) => s.updateLine)
  const deleteLine = useVideoStore((s) => s.deleteLine)

  const setSelectedPolyPoint = useUntrackedVideoStore((s) => s.setSelectedPolyPoint)
  const setSelectedPolyId = useUntrackedVideoStore((s) => s.setSelectedPolyId)
  const setSelectedRectangleId = useUntrackedVideoStore((s) => s.setSelectedRectangleId)
  const setSelectedCircleId = useUntrackedVideoStore((s) => s.setSelectedCircleId)
  const setSelectedLinePoint = useUntrackedVideoStore((s) => s.setSelectedLinePoint)
  const setSelectedLineId = useUntrackedVideoStore((s) => s.setSelectedLineId)
  const setIsDrawingPolygon = useUntrackedVideoStore((s) => s.setIsDrawingPolygon)
  const setIsDrawingLine = useUntrackedVideoStore((s) => s.setIsDrawingLine)
  const isDrawingLine = useUntrackedVideoStore((s) => s.isDrawingLine)
  const isDrawingPolygon = useUntrackedVideoStore((s) => s.isDrawingPolygon)
  const setSelectedFaceId = useUntrackedVideoStore((s) => s.setSelectedFaceId)

  const handleWindowResize = useCallback(async () => {
    if (!videoRef.current || !stageRef.current || !drawboardRef.current) {
      return
    }

    videoRef.current.style.maxHeight = `${drawboardRef.current.offsetHeight}px`
    videoRef.current.style.maxWidth = `${drawboardRef.current.offsetWidth}px`

    const { offsetHeight, offsetWidth, offsetTop, offsetLeft, videoHeight, videoWidth } =
      videoRef.current
    const stage = stageRef.current
    stage.height(offsetHeight)
    stage.width(offsetWidth)
    stage.offsetX(offsetLeft)
    stage.offsetY(offsetTop)

    setImgSize({
      naturalHeight: videoHeight,
      naturalWidth: videoWidth,
      offsetHeight,
      offsetLeft,
      offsetTop,
      offsetWidth
    })
    setLoaded(true)
  }, [])

  useHotkeys('n', () => {
    setIsDrawingPolygon(true)
  })

  const calculateCurrentFrame = () => {
    if (!videoRef.current || !fileObj || !fileObj.fps) return 0
    const frame = calculateFrame(videoRef.current.currentTime, fileObj.fps)
    return frame
  }

  const finalizePolygon = () => {
    // Complete polygon
    // Complete adding points to polygon
    if (addPointsPolyIdRef.current) {
      setIsDrawingPolygon(null)
      addPointsPolyIdRef.current = null
    }

    // Complete new polygon
    if (newPolyIdRef.current) {
      setShowAddModal(true)
    }
  }

  const handlePolyDraw = (newPoint: PointType) => {
    if (!orgId || !projectId || !fileId) return

    const polyId = addPointsPolyIdRef.current || newPolyIdRef.current
    if (!polyId) {
      newPolyIdRef.current = generateId()
      setIsDrawingPolygon(newPolyIdRef.current)
      const newPoly: PolygonType = {
        id: newPolyIdRef.current,
        name: '',
        notes: '',
        points: [newPoint],
        stroke: 'rgb(255, 0, 0)',
        strokeWidth: 2,
        orgId,
        projectId,
        fileId
      }

      const currentFrame = calculateCurrentFrame()
      addPolygon(currentFrame, newPoly)
      return
    }

    const currentFrame = calculateCurrentFrame()
    const anc = polygons[currentFrame].find((p) => p.id === polyId)
    if (!anc) return

    const firstX = anc.points[0].x
    const firstY = anc.points[0].y
    const xdiff = Math.abs(newPoint.x - firstX)
    const ydiff = Math.abs(newPoint.y - firstY)
    if (xdiff > 10 || ydiff > 10) {
      // Add points to polygon
      const currentFrame = calculateCurrentFrame()
      addPointsToPolygon(currentFrame, polyId, newPoint)
      return
    }

    // Complete polygon
    // Complete adding points to polygon
    finalizePolygon()
  }

  const finalizeLine = () => {
    // Complete polygon
    // Complete adding points to polygon
    if (addPointsLineIdRef.current) {
      setIsDrawingLine(null)
      addPointsLineIdRef.current = null
    }

    // Complete new polygon
    if (newLineIdRef.current) {
      setShowAddModal(true)
    }
  }

  const handleLineDraw = (newPoint: PointType) => {
    if (!orgId || !projectId || !fileId) return

    const lineId = addPointsLineIdRef.current || newLineIdRef.current
    const currentFrame = calculateCurrentFrame()

    if (!lineId) {
      newLineIdRef.current = generateId()
      setIsDrawingLine(newLineIdRef.current)
      const newLine: LineType = {
        id: newLineIdRef.current,
        name: '',
        notes: '',
        points: [newPoint],
        stroke: 'rgb(255, 0, 0)',
        strokeWidth: 2,
        orgId,
        projectId,
        fileId
      }

      addLine(currentFrame, newLine)
      return
    }

    const anc = lines[currentFrame].find((l) => l.id === lineId)
    if (!anc) return

    const firstX = anc.points[0].x
    const firstY = anc.points[0].y
    const xdiff = Math.abs(newPoint.x - firstX)
    const ydiff = Math.abs(newPoint.y - firstY)
    if (xdiff > 10 || ydiff > 10) {
      // Add points to polygon

      addPointsToLine(currentFrame, lineId, newPoint)
      return
    }

    // Complete polygon
    // Complete adding points to polygon
    finalizeLine()
  }

  const handleMouseUp = () => {
    const stage = stageRef.current
    if (!stage) return

    const oldScale = stage.scaleX()
    const vector = stage.getPointerPosition()
    if (!vector) return

    const { x, y } = {
      x: vector.x / oldScale - stage.x() / oldScale,
      y: vector.y / oldScale - stage.y() / oldScale
    }

    const newPoint: PointType = { x, y, id: generateId() }

    if (isDrawingPolygon) {
      handlePolyDraw(newPoint)
    }

    if (isDrawingLine) {
      handleLineDraw(newPoint)
    }
  }

  const handleImgLoad = useCallback(() => {
    handleWindowResize()
  }, [handleWindowResize])

  const getScaledPoints = (pts: PointType[]) => {
    const videoEle = videoRef.current
    if (!videoEle) return pts

    const scaleX = videoEle.offsetWidth / videoEle.videoWidth
    const scaleY = videoEle.offsetHeight / videoEle.videoHeight
    return pts.map((p) => ({ ...p, x: p.x / scaleX, y: p.y / scaleY }))
  }

  const completeShape = (
    name: string,
    notes: string,
    classId?: string,
    attribute?: string,
    text?: string,
    ID?: string,
    color?: string
  ) => {
    const currentFrame = calculateCurrentFrame()

    if (newPolyIdRef.current) {
      const finishedPolygon = updatePolygon(currentFrame, newPolyIdRef.current, {
        name,
        notes,
        stroke: color || 'rgb(255, 0, 0)',
        classId,
        attribute,
        text,
        ID
      })
      if (orgId && projectId && fileId) {
        createShapeMutate({
          orgId,
          projectId,
          fileId,
          shape: {
            ...finishedPolygon,
            points: getScaledPoints(finishedPolygon.points),
            stroke: color || 'rgb(255, 0, 0)',
            strokeWidth: 2,
            color: color || 'rgb(255, 0, 0)',
            type: 'polygon',
            orgId,
            projectId,
            fileId,
            classId,
            attribute,
            text,
            ID,
            atFrame: calculateCurrentFrame()
          }
        })
      }
      setIsDrawingPolygon(null)
      newPolyIdRef.current = null
    }

    if (newLineIdRef.current) {
      const finishedLine = updateLine(currentFrame, newLineIdRef.current, {
        name,
        notes,
        classId,
        attribute,
        text,
        ID
      })
      if (orgId && projectId && fileId) {
        createShapeMutate({
          orgId,
          projectId,
          fileId,
          shape: {
            ...finishedLine,
            points: getScaledPoints(finishedLine.points),
            stroke: color || 'rgb(255, 0, 0)',
            strokeWidth: 2,
            color: color || 'rgb(255, 0, 0)',
            type: 'line',
            orgId,
            projectId,
            fileId,
            classId,
            attribute,
            text,
            ID,
            atFrame: calculateCurrentFrame()
          }
        })
      }
      setIsDrawingLine(null)
      newLineIdRef.current = null
    }

    setShowAddModal(false)
  }

  const cancelShape = () => {
    if (newPolyIdRef.current) {
      handleDeletePolygon(newPolyIdRef.current)
      newPolyIdRef.current = null
    }

    if (newLineIdRef.current) {
      handleDeleteLine(newLineIdRef.current)
      newLineIdRef.current = null
    }

    setIsDrawingLine(null)
    setIsDrawingPolygon(null)
    setShowAddModal(false)
  }

  const onStageClick = () => {
    setSelectedPolyPoint(null)
    setSelectedLinePoint(null)

    setSelectedPolyId(null)
    setSelectedLineId(null)
    setSelectedRectangleId(null)
    setSelectedCircleId(null)
    setSelectedFaceId(null)
  }

  const handleDeleteLine = (lineId: string) => {
    const currentFrame = calculateCurrentFrame()
    deleteLine(currentFrame, lineId)
    setSelectedLineId(null)
    setSelectedLinePoint(null)
  }

  const handleDeletePolygon = (polyId: string) => {
    const currentFrame = calculateCurrentFrame()
    deletePolygon(currentFrame, polyId)
    setSelectedPolyId(null)
    setSelectedPolyPoint(null)
  }

  const onAddLinePoints = (lineId: string) => {
    setIsDrawingLine(lineId)
    addPointsLineIdRef.current = lineId
  }

  const onAddPolyPoints = (polyId: string) => {
    setIsDrawingPolygon(polyId)
    addPointsPolyIdRef.current = polyId
  }

  const handleEsc = useCallback(() => {
    setIsDrawingPolygon(null)
    setIsDrawingLine(null)

    setSelectedLinePoint(null)
    setSelectedPolyPoint(null)

    setSelectedPolyId(null)
    setSelectedLineId(null)

    if (newPolyIdRef.current) {
      const currentFrame = calculateCurrentFrame()
      deletePolygon(currentFrame, newPolyIdRef.current)
    }
    newPolyIdRef.current = null
    addPointsPolyIdRef.current = null

    if (newLineIdRef.current) {
      const currentFrame = calculateCurrentFrame()
      deleteLine(currentFrame, newLineIdRef.current)
    }
    newLineIdRef.current = null
    addPointsLineIdRef.current = null
  }, [])
  useHotkeys(['esc'], handleEsc, [handleEsc])

  if (!fileObj) {
    return <Navigate to={`/orgs/${orgId}/projects/${projectId}/dashboard`} />
  }

  return (
    <div
      className="grid gap-4 relative w-full h-full p-4"
      style={{ gridTemplateRows: '60px minmax(0, 1fr) 80px' }}
    >
      <AddNameModal
        isOpen={showAddModal}
        onCancel={cancelShape}
        onAdd={completeShape}
        selectedClass={null}
        initName={
          isDrawingPolygon
            ? `Polygon ${getAllPolygons().length + 1}`
            : `Line ${getAllLines().length + 1}`
        }
      />

      <AnnotateHeader />

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `minmax(0, 1fr) ${ANNOTATIONLIST_WIDTH}px ${ANNOTATION_TOOLBAR_WIDTH}px`
        }}
      >
        <div
          className="grid gap-4 overflow-hidden"
          style={{ gridTemplateRows: 'minmax(0, 1fr) 100px' }}
        >
          <div
            ref={drawboardRef}
            className="relative bg-white rounded-xl flex justify-center items-center w-full h-full overflow-hidden"
          >
            <div
              className={cn('relative h-fit w-fit ', {
                'cursor-crosshair': isDrawingPolygon || isDrawingLine
              })}
            >
              <video
                ref={videoRef}
                src={getStoredUrl(fileObj.url, fileObj.storedIn)}
                onLoadedMetadata={handleImgLoad}
              />

              <Stage
                style={{ top: `${imgSize.offsetTop}px`, left: `${imgSize.offsetLeft}px` }}
                ref={stageRef}
                width={500}
                height={500}
                className="absolute z-10"
                onMouseUp={handleMouseUp}
                onClick={onStageClick}
              >
                {imgLoaded && (
                  <Shapes
                    calculateCurrentFrame={calculateCurrentFrame}
                    selectCommentTab={() => setSelectedTab('comments')}
                    stageRef={stageRef}
                    imgSize={imgSize}
                  />
                )}
              </Stage>
            </div>
          </div>

          <div className="bg-white rounded-xl overflow-hidden">
            <VideoControls videoRef={videoRef} videoObj={fileObj} />
          </div>
        </div>

        <div
          className="bg-white rounded-xl overflow-hidden p-3"
          style={{ width: `${ANNOTATIONLIST_WIDTH}px` }}
        >
          <AnnotationTabs
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
            videoRef={videoRef}
            onAddLinePoints={onAddLinePoints}
            onAddPolyPoints={onAddPolyPoints}
            imgLoaded={imgLoaded}
          />
        </div>

        <div className="bg-brand1 rounded-xl" style={{ width: `${ANNOTATION_TOOLBAR_WIDTH}px` }}>
          <AnnotationToolbar
            videoRef={videoRef}
            finalizePolygon={finalizePolygon}
            finalizeLine={finalizeLine}
            calculateCurrentFrame={calculateCurrentFrame}
          />
        </div>
      </div>

      <div
        className="p-3 gap-x-3 grid gap-2 rounded-xl bg-white"
        style={{ gridTemplateColumns: '40px 1fr 40px' }}
      >
        <PrevImage />

        <div className="flex items-center overflow-scroll">
          {files.map((file) => (
            <Link
              to={`/orgs/${orgId}/projects/${file.projectId}/files/${file.id}/annotate`}
              className={cn(
                'flex-shrink-0 block relative w-20 h-full rounded-lg border-4 border-transparent',
                { 'border-brand1': fileObj.id === file.id }
              )}
              key={file.id}
            >
              {file.type === 'image' ? (
                <img
                  className="w-20 h-full object-cover rounded-sm"
                  src={getStoredUrl(file.url, fileObj.storedIn)}
                  alt={file.originalName}
                />
              ) : (
                <video
                  className="w-20 h-full object-cover rounded-sm"
                  src={getStoredUrl(file.url, fileObj.storedIn)}
                />
              )}

              {file.complete && (
                <div className="absolute -top-0 -right-0 bg-white rounded-full text-green-500">
                  <BsFillCheckCircleFill />
                </div>
              )}
            </Link>
          ))}
        </div>

        <NextImage />
      </div>
    </div>
  )
}

export default VideoAnnotate
