import { FC, ReactEventHandler, useCallback, useEffect, useRef, useState } from 'react'
import { Stage, Layer, Image } from 'react-konva'
import { Stage as StageType } from 'konva/lib/Stage'
import { Image as ImageType } from 'konva/lib/shapes/Image'
import { Navigate, useParams } from 'react-router-dom'
import { useHotkeys } from 'react-hotkeys-hook'
import { BsFillCheckCircleFill } from 'react-icons/bs'
import useImage from 'use-image'
import Konva from 'konva'
import { FaAngleDown, FaAngleLeft, FaAngleRight, FaAngleUp } from 'react-icons/fa'
import { MdFitScreen } from 'react-icons/md'

import { cn } from '@renderer/utils/cn'
import PolygonType from '@models/Polygon.model'
import AddNameModal from '@/components/modals/AddNameModal'
import PointType from '@models/Point.model'
import { ANNOTATIONLIST_WIDTH, HEADER_HEIGHT, SIDEBAR_WIDTH } from '@renderer/constants'
import { generateId, getStoredUrl } from '@renderer/utils/vars'
import { useFilesStore } from '@renderer/store/files.store'
import NextImage from './NextImage'
import PrevImage from './PrevImage'
import Shapes from './Shapes'
import AnnotationTabs from './AnnotationTabs'
import LineType from '@models/Line.model'
import { useMutation } from '@tanstack/react-query'
import { shapesService, filesService } from '@/services/supabase'
import type { ShapeType as SupabaseShapeType } from '@/lib/supabase'
import { useOrgStore } from '@renderer/store/organization.store'
import ImgSize from '@models/ImgSize.model'
import { ShapeType } from '@models/Shape.model'
import { useImageStore, useImageUntrackedStore } from './store/image.store'
import AnnotateSidebar from '@renderer/components/Annotate/AnnotateSidebar'
import { createPortal } from 'react-dom'
import Tooltip from '@/components/ui/Tooltip'
import HoverText from '@/components/ui/HoverText'
import Button from '@/components/ui/Button'
import { BiX } from 'react-icons/bi'
import FileType from '@renderer/models/File.model'

type TabsName = 'annotation_list' | 'comments'

const scaleBy = 1.05

const ImageAnnotate: FC = () => {
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
  const [showAnnotationBar, setShowAnnotationBar] = useState(false)
  const [showImagesBar, setShowImagesBar] = useState(false)

  const { projectid: projectId } = useParams()
  const files = useFilesStore((state) => state.files)
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id
  const setSelectedFile = useFilesStore((s) => s.setSelectedFile)
  const [imgSrcUrl] = useImage(fileObj?.url || '')

  const orgId = useOrgStore((s) => s.selectedOrg)
  const { mutate: createShapeMutate } = useMutation({
    mutationFn: ({
      shape
    }: {
      orgId: string
      projectId: string
      fileId: string
      shape: ShapeType
    }) =>
      shapesService.createShape({
        id: shape.id,
        name: shape.name,
        type: shape.type as SupabaseShapeType,
        orgId: shape.orgId,
        projectId: shape.projectId,
        fileId: shape.fileId,
        classId: shape.classId,
        notes: shape.notes,
        strokeWidth: shape.strokeWidth,
        x: shape.x,
        y: shape.y,
        height: shape.height,
        width: shape.width,
        points: shape.points,
        textField: shape.text,
        idField: shape.ID,
        attribute: shape.attribute,
        atFrame: shape.atFrame
      })
  })

  const imgRef = useRef<HTMLImageElement>(null)
  const newPolyIdRef = useRef<string | null>(null)
  const addPointsPolyIdRef = useRef<string | null>(null)
  const newLineIdRef = useRef<string | null>(null)
  const addPointsLineIdRef = useRef<string | null>(null)
  const stageRef = useRef<StageType | null>(null)
  const drawboardRef = useRef<HTMLDivElement>(null)
  const stageImgRef = useRef<ImageType | null>(null)

  const setSelectedShape = useImageUntrackedStore((s) => s.setSelectedShape)
  const drawingShape = useImageUntrackedStore((s) => s.drawingShape)
  const setDrawingShape = useImageUntrackedStore((s) => s.setDrawingShape)
  const setSelectedPolyPoint = useImageUntrackedStore((state) => state.setSelectedPolyPoint)
  const setSelectedLinePoint = useImageUntrackedStore((state) => state.setSelectedLinePoint)
  const selectedClass = useImageUntrackedStore((s) => s.selectedClass)

  const polygons = useImageStore((state) => state.polygons)
  const updatePolygon = useImageStore((state) => state.updatePolygon)
  const addPolygon = useImageStore((state) => state.addPolygon)
  const addPointsToPolygon = useImageStore((state) => state.addPointsToPolygon)
  const deletePolygon = useImageStore((state) => state.deletePolygon)

  const lines = useImageStore((state) => state.lines)
  const updateLine = useImageStore((state) => state.updateLine)
  const deleteLine = useImageStore((state) => state.deleteLine)
  const addLine = useImageStore((state) => state.addLine)
  const addPointsToLine = useImageStore((state) => state.addPointsToLine)

  const selectedColor = selectedClass?.color || 'rgb(255, 0, 0)'

  const currFileIdx = files.findIndex((f) => f.id === fileId)
  const [thumbFiles, setThumbFiles] = useState<FileType[]>([])

  const fileUpdateMutation = useMutation({
    mutationFn: ({
      fileId,
      width,
      height
    }: {
      orgId: string
      projectId: string
      fileId: string
      width: number
      height: number
    }) => filesService.updateFile(fileId, { width, height })
  })

  const handleWindowResize = useCallback(async () => {
    if (!imgRef.current || !stageRef.current || !stageImgRef.current || !drawboardRef.current) {
      return
    }

    imgRef.current.style.maxHeight = `${drawboardRef.current.offsetHeight}px`
    imgRef.current.style.maxWidth = `${drawboardRef.current.offsetWidth}px`

    const { offsetHeight, offsetWidth, offsetTop, offsetLeft, naturalHeight, naturalWidth } =
      imgRef.current
    const stage = stageRef.current
    stage.height(offsetHeight)
    stage.width(offsetWidth)
    stage.offsetX(offsetLeft)
    stage.offsetY(offsetTop)
    stage.scale({ x: 1, y: 1 })
    stage.position({ x: 0, y: 0 })

    const stageImage = stageImgRef.current
    stageImage.height(offsetHeight)
    stageImage.width(offsetWidth)
    stageImage.offsetX(offsetLeft)
    stageImage.offsetY(offsetTop)

    setImgSize({ naturalHeight, naturalWidth, offsetHeight, offsetLeft, offsetTop, offsetWidth })
    setLoaded(true)
  }, [])

  useHotkeys('n', () => {
    setDrawingShape({ type: 'polygon', id: null })
  })

  useEffect(() => {
    newPolyIdRef.current = null
    newLineIdRef.current = null

    if (!fileId) return
    setThumbFiles(files.slice(Math.max(currFileIdx, 10) - 10, currFileIdx + 100))

    const exist = thumbFiles.find((t) => t.id === fileId)
    if (!exist) {
      setTimeout(() => {
        const thumbEle = document.getElementById(`thumb-${fileId}`)
        if (thumbEle) {
          thumbEle.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
        }
      }, 50)
    }
  }, [fileId])

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return

    const oldScale = stage.scaleX()
    const vector = stage.getPointerPosition()
    if (!vector) return

    const mousePointTo = {
      x: vector.x / oldScale - stage.x() / oldScale,
      y: vector.y / oldScale - stage.y() / oldScale
    }

    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy
    stage.scale({ x: newScale, y: newScale })

    const newPos = {
      x: vector.x - mousePointTo.x * newScale,
      y: vector.y - mousePointTo.y * newScale
    }
    stage.position(newPos)
    stage.batchDraw()
  }

  const finalizePolygon = () => {
    // Complete polygon
    // Complete adding points to polygon
    if (addPointsPolyIdRef.current) {
      setDrawingShape({ type: 'polygon', id: null })
      addPointsPolyIdRef.current = null
    }

    // Complete new polygon
    if (newPolyIdRef.current) {
      setShowAddModal(true)
    }
  }

  const handlePolyDraw = (newPoint: PointType) => {
    const polyId = addPointsPolyIdRef.current || newPolyIdRef.current
    if (!polyId) {
      newPolyIdRef.current = generateId()
      setDrawingShape({ type: 'polygon', id: newPolyIdRef.current })
      const newPoly: PolygonType = {
        id: newPolyIdRef.current,
        name: '',
        notes: '',
        points: [newPoint],
        stroke: selectedColor,
        strokeWidth: 2,
        orgId: orgId!,
        projectId: projectId!,
        fileId: fileId!
      }

      addPolygon(newPoly)
      return
    }

    const anc = polygons.find((p) => p.id === polyId)
    if (!anc) return

    const firstX = anc.points[0].x
    const firstY = anc.points[0].y
    const xdiff = Math.abs(newPoint.x - firstX)
    const ydiff = Math.abs(newPoint.y - firstY)
    if (xdiff > 10 || ydiff > 10) {
      // Add points to polygon
      addPointsToPolygon(polyId, newPoint)
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
      setDrawingShape({ type: 'line', id: null })
      addPointsLineIdRef.current = null
    }

    // Complete new polygon
    if (newLineIdRef.current) {
      setShowAddModal(true)
    }
  }

  const handleLineDraw = (newPoint: PointType) => {
    const lineId = addPointsLineIdRef.current || newLineIdRef.current
    if (!lineId) {
      newLineIdRef.current = generateId()
      setDrawingShape({ type: 'line', id: newLineIdRef.current })
      const newLine: LineType = {
        id: newLineIdRef.current,
        name: '',
        notes: '',
        points: [newPoint],
        stroke: selectedColor,
        strokeWidth: 2,
        orgId: orgId!,
        projectId: projectId!,
        fileId: fileId!
      }

      addLine(newLine)
      return
    }

    const anc = lines.find((l) => l.id === lineId)
    if (!anc) return

    const firstX = anc.points[0].x
    const firstY = anc.points[0].y
    const xdiff = Math.abs(newPoint.x - firstX)
    const ydiff = Math.abs(newPoint.y - firstY)
    if (xdiff > 10 || ydiff > 10) {
      // Add points to polygon
      addPointsToLine(lineId, newPoint)
      return
    }

    // Complete polygon
    // Complete adding points to polygon
    finalizeLine()
  }

  const getCursorPosition = () => {
    const stage = stageRef.current
    if (!stage) return null

    const oldScale = stage.scaleX()
    const vector = stage.getPointerPosition()
    if (!vector) return null

    const { x, y } = {
      x: vector.x / oldScale - stage.x() / oldScale,
      y: vector.y / oldScale - stage.y() / oldScale
    }

    return { x, y }
  }

  const handleMouseUp = () => {
    const stage = stageRef.current
    if (!stage) return

    const pos = getCursorPosition()
    if (!pos) return

    const newPoint: PointType = { x: pos.x, y: pos.y, id: generateId() }
    if (drawingShape?.type === 'polygon') {
      handlePolyDraw(newPoint)
    }

    if (drawingShape?.type === 'line') {
      handleLineDraw(newPoint)
    }
  }

  const handleImgLoad: ReactEventHandler<HTMLImageElement> = (e) => {
    handleWindowResize()

    const img = e.target as HTMLImageElement
    if (!orgId || !projectId || !fileId || !img) return
    fileUpdateMutation.mutate({
      orgId,
      projectId,
      fileId,
      width: img.naturalWidth,
      height: img.naturalHeight
    })
  }

  const getScaledPoints = (pts: PointType[]) => {
    const imgEle = imgRef.current
    if (!imgEle) return pts

    const scaleX = imgEle.offsetWidth / imgEle.naturalWidth
    const scaleY = imgEle.offsetHeight / imgEle.naturalHeight
    return pts.map((p) => ({ ...p, x: p.x / scaleX, y: p.y / scaleY }))
  }

  const completeShape = (
    name: string,
    notes: string,
    classId?: string,
    attribute?: string,
    text?: string,
    ID?: string
  ) => {
    if (newPolyIdRef.current) {
      const finishedPolygon = updatePolygon(newPolyIdRef.current, {
        name,
        notes,
        stroke: selectedColor,
        classId,
        attribute,
        text,
        ID
      })
      if (orgId && projectId && fileId) {
        const newPoly: ShapeType = {
          ...finishedPolygon,
          points: getScaledPoints(finishedPolygon.points),
          stroke: selectedColor,
          strokeWidth: 2,
          color: selectedColor,
          type: 'polygon',
          orgId,
          projectId,
          fileId,
          classId,
          attribute,
          text,
          ID,
          atFrame: 1
        }
        createShapeMutate({
          orgId,
          projectId,
          fileId,
          shape: newPoly
        })
        useFilesStore.getState().addShapeToFile(fileId, 'polygon', newPoly)
      }
      setDrawingShape({ type: 'polygon', id: null })
      newPolyIdRef.current = null
    }

    if (newLineIdRef.current) {
      const finishedLine = updateLine(newLineIdRef.current, {
        name,
        notes,
        classId,
        attribute,
        text,
        ID
      })
      if (orgId && projectId && fileId) {
        const newLine: ShapeType = {
          ...finishedLine,
          points: getScaledPoints(finishedLine.points),
          stroke: selectedColor,
          strokeWidth: 2,
          color: selectedColor,
          type: 'line',
          orgId,
          projectId,
          fileId,
          classId,
          attribute,
          text,
          ID,
          atFrame: 1
        }
        createShapeMutate({
          orgId,
          projectId,
          fileId,
          shape: newLine
        })
        useFilesStore.getState().addShapeToFile(fileId, 'line', newLine)
      }
      setDrawingShape({ type: 'line', id: null })
      newLineIdRef.current = null
    }

    setShowAddModal(false)
  }

  const cancelShape = () => {
    if (newPolyIdRef.current) {
      handleDeletePolygon(newPolyIdRef.current)
      setDrawingShape({ type: 'polygon', id: null })
      newPolyIdRef.current = null
    }

    if (newLineIdRef.current) {
      handleDeleteLine(newLineIdRef.current)
      setDrawingShape({ type: 'line', id: null })
      newLineIdRef.current = null
    }

    setShowAddModal(false)
  }

  const onStageClick = () => {
    setSelectedPolyPoint(null)
    setSelectedLinePoint(null)
    setSelectedShape(null)
  }

  const handleDeleteLine = (lineId: string) => {
    deleteLine(lineId)
    setSelectedShape(null)
    setSelectedLinePoint(null)
  }

  const handleDeletePolygon = (polyId: string) => {
    deletePolygon(polyId)
    setSelectedShape(null)
    setSelectedPolyPoint(null)
  }

  const onAddLinePoints = (lineId: string) => {
    setDrawingShape({ type: 'line', id: lineId })
    addPointsLineIdRef.current = lineId
  }

  const onAddPolyPoints = (polyId: string) => {
    setDrawingShape({ type: 'polygon', id: polyId })
    addPointsPolyIdRef.current = polyId
  }

  const handleEsc = useCallback(() => {
    if (newPolyIdRef.current) {
      deletePolygon(newPolyIdRef.current)
    }
    newPolyIdRef.current = null
    addPointsPolyIdRef.current = null

    if (newLineIdRef.current) {
      deleteLine(newLineIdRef.current)
    }
    newLineIdRef.current = null
    addPointsLineIdRef.current = null
  }, [])
  useHotkeys(['esc'], handleEsc, [handleEsc])

  if (!fileObj) {
    return <Navigate to={`/orgs/${orgId}/projects/${projectId}/dashboard`} />
  }

  return (
    <div className="flex flex-row">
      <div className="flex-grow-0" style={{ width: `${SIDEBAR_WIDTH}px` }}>
        <AnnotateSidebar
          imgRef={imgRef}
          stageRef={stageRef}
          finalizeLine={finalizeLine}
          finalizePolygon={finalizePolygon}
          drawPolygon={handleMouseUp}
        />
      </div>

      {/* Routes */}
      <div className="bg-gray-200 flex-grow" style={{ height: `calc(100vh - ${HEADER_HEIGHT}px)` }}>
        <div className="relative w-full h-full p-7">
          <AddNameModal
            isOpen={showAddModal}
            onCancel={cancelShape}
            onAdd={completeShape}
            selectedClass={selectedClass}
            initName={
              drawingShape?.type === 'polygon'
                ? `Polygon ${polygons.length}`
                : `Line ${lines.length}`
            }
          />

          <div className="grid h-full" style={{ gridTemplateRows: 'minmax(0, 1fr)' }}>
            <div
              ref={drawboardRef}
              className="relative bg-white rounded-xl flex justify-center items-center w-full h-full overflow-hidden"
            >
              <div className={cn('relative h-fit w-fit', { 'cursor-crosshair': !!drawingShape })}>
                <img
                  style={{
                    maxHeight: `${drawboardRef.current?.offsetHeight}px`,
                    maxWidth: `${drawboardRef.current?.offsetWidth}px`,
                    visibility: 'hidden'
                  }}
                  className="max-h-full max-w-full"
                  ref={imgRef}
                  src={fileObj.url}
                  alt={fileObj.originalName}
                  onLoad={handleImgLoad}
                />

                <Stage
                  style={{ top: `${imgSize.offsetTop}px`, left: `${imgSize.offsetLeft}px` }}
                  draggable={!drawingShape}
                  onWheel={handleWheel}
                  ref={stageRef}
                  width={500}
                  height={500}
                  className="absolute z-10"
                  onClick={onStageClick}
                >
                  <Layer>
                    <Image ref={stageImgRef} image={imgSrcUrl} />
                  </Layer>

                  {imgLoaded && (
                    <Shapes
                      selectCommentTab={() => setSelectedTab('comments')}
                      stageRef={stageRef}
                      imgSize={imgSize}
                    />
                  )}
                </Stage>
              </div>
            </div>

            {!showAnnotationBar && (
              <button
                onClick={() => setShowAnnotationBar(true)}
                className="bg-brand1 z-10 py-2 text-white absolute top-10 right-0 rounded-l-full"
              >
                <FaAngleLeft size={25} />
              </button>
            )}

            {showAnnotationBar && (
              <button
                className="bg-brand1 z-10 py-3 pl-1 text-white top-10 absolute rounded-l-full"
                onClick={() => setShowAnnotationBar(false)}
                style={{ right: `${ANNOTATIONLIST_WIDTH + 20}px` }}
              >
                <FaAngleRight size={25} />
              </button>
            )}

            <div
              className={cn(
                'absolute z-20 right-5 top-5 bottom-5 bg-white rounded-xl overflow-hidden p-3  shadow-lg border border-gray-200',
                { invisible: !showAnnotationBar }
              )}
              style={{ width: `${ANNOTATIONLIST_WIDTH}px` }}
            >
              <AnnotationTabs
                selectedTab={selectedTab}
                setSelectedTab={setSelectedTab}
                imgRef={imgRef}
                onAddLinePoints={onAddLinePoints}
                onAddPolyPoints={onAddPolyPoints}
                imgLoaded={imgLoaded}
              />
            </div>
          </div>

          {!showImagesBar && (
            <button
              onClick={() => setShowImagesBar(true)}
              className="bg-brand1 z-20 pt-0.5 pb-0 px-3 text-white absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-t-full"
            >
              <FaAngleUp size={25} />
            </button>
          )}

          {showImagesBar && (
            <button
              onClick={() => setShowImagesBar(false)}
              className="bg-brand1 z-20 py-0.5 px-3 text-white absolute bottom-24 left-1/2 -translate-x-1/2 rounded-t-full"
            >
              <FaAngleDown size={25} />
            </button>
          )}

          <div
            className={cn(
              'shadow-lg absolute bottom-2 z-20 left-5 right-5 p-3 gap-x-3 grid gap-2 rounded-xl bg-white border border-gray-200',
              { invisible: !showImagesBar }
            )}
            style={{ gridTemplateColumns: '40px 1fr 40px' }}
          >
            <PrevImage />

            <div className="flex items-center overflow-scroll scroll-smooth">
              {thumbFiles.map((file) => (
                <div id={`thumb-${file.id}`} key={`thumb-${file.id}`}>
                  <Button
                    onClick={() => {
                      setSelectedFile(file)
                    }}
                    className={cn(
                      'flex-shrink-0 block bg-white relative w-20 h-full rounded-lg border-4 border-transparent p-1',
                      { 'border-brand1': fileObj.id === file.id }
                    )}
                  >
                    {file.type === 'image' ? (
                      <img
                        className="w-20 max-h-12 h-full object-cover rounded-sm"
                        src={file.url}
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

                    {file.skipped && (
                      <div className="absolute -top-0 -right-0 bg-red-500 text-white rounded-full">
                        <BiX />
                      </div>
                    )}
                  </Button>
                </div>
              ))}
            </div>

            <NextImage />
          </div>
        </div>
      </div>

      {document.getElementById('fit-size-button') && (
        <>
          {createPortal(
            <Tooltip tooltipChildren={<HoverText>Fit</HoverText>} align="bottom" move={-5}>
              <button className="text-brand1" onClick={handleWindowResize}>
                <MdFitScreen size={30} />
              </button>
            </Tooltip>,
            document.getElementById('fit-size-button')!
          )}
        </>
      )}
    </div>
  )
}

export default ImageAnnotate
