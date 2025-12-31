import { FC, RefObject, useCallback, useEffect, useRef } from 'react'
import { TbShape2 } from 'react-icons/tb'
import { BiShapeSquare, BiShapePolygon } from 'react-icons/bi'
import { useMutation } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { useHotkeys } from 'react-hotkeys-hook'
import { Stage as StageType } from 'konva/lib/Stage'

import { cn } from '@renderer/utils/cn'
import { createShape } from '@renderer/helpers/axiosRequests'
import { useOrgStore } from '@renderer/store/organization.store'
import { generateId } from '@renderer/utils/vars'
import Tooltip from '@renderer/components/common/Tooltip'
import HoverText from '@renderer/components/common/HoverText'
import { ShapeType } from '@models/Shape.model'
import { useFilesStore } from '@renderer/store/files.store'
import { useImageStore, useImageUntrackedStore } from './store/image.store'

type AnnotationToolbarProps = {
  imgRef: RefObject<HTMLImageElement>
  stageRef: RefObject<StageType>
  finalizePolygon: () => void
  finalizeLine: () => void
  drawPolygon: () => void
}
const AnnotationToolbar: FC<AnnotationToolbarProps> = ({
  finalizePolygon,
  finalizeLine,
  imgRef,
  stageRef,
  drawPolygon
}) => {
  const orgId = useOrgStore((s) => s.selectedOrg)
  const { projectid: projectId } = useParams()
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id
  const newRectIdRef = useRef<string | null>(null)
  const lastUsedShape = useRef<ShapeType['type']>('rectangle')

  const setSelectedShape = useImageUntrackedStore((s) => s.setSelectedShape)
  const drawingShape = useImageUntrackedStore((s) => s.drawingShape)
  const setDrawingShape = useImageUntrackedStore((s) => s.setDrawingShape)

  const setSelectedLinePoint = useImageUntrackedStore((state) => state.setSelectedLinePoint)
  const setSelectedPolyPoint = useImageUntrackedStore((state) => state.setSelectedPolyPoint)
  const aiPoints = useImageUntrackedStore((s) => s.aIPoints)
  const setAIPoints = useImageUntrackedStore((s) => s.setAIPoints)
  const selectedClass = useImageUntrackedStore((s) => s.selectedClass)
  const selectedColor = selectedClass?.color || 'rgb(255, 0, 0)'
  const resizeRectangle = useImageStore((s) => s.resizeRectangle)
  const rectangles = useImageStore((s) => s.rectangles)
  const addRectangle = useImageStore((s) => s.addRectangle)
  const getRectangleById = useImageStore((s) => s.getRectangleById)
  const deleteRect = useImageStore((s) => s.deleteRectangle)
  // const circles = useImageStore((s) => s.circles)
  // const addCircle = useImageStore((s) => s.addCircle)

  const { mutate: createShapeMutate } = useMutation(createShape)

  const getScale = useCallback(() => {
    const imgEle = imgRef.current
    if (!imgEle) return { scaleX: 1, scaleY: 1 }

    const scaleX = imgEle.offsetWidth / imgEle.naturalWidth
    const scaleY = imgEle.offsetHeight / imgEle.naturalHeight
    return { scaleX, scaleY }
  }, [])

  const getCursorPosition = useCallback(() => {
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
  }, [])

  const handleMouseMove = useCallback(() => {
    const pos = getCursorPosition()
    if (!pos) return

    if (aiPoints && drawingShape?.type === 'ai') {
      setAIPoints({ x1: aiPoints.x1, y1: aiPoints.y1, x2: pos.x, y2: pos.y })
    }

    if (drawingShape?.type === 'rectangle' && newRectIdRef.current) {
      resizeRectangle(newRectIdRef.current, pos.x, pos.y)
    }
  }, [getCursorPosition, aiPoints, drawingShape, resizeRectangle])

  const handleMouseUp = useCallback(() => {
    const pos = getCursorPosition()
    if (!pos) return

    if (drawingShape?.type === 'ai' && aiPoints) {
      setAIPoints({ x1: aiPoints.x1, y1: aiPoints.y1, x2: pos.x, y2: pos.y })
      setDrawingShape(null)
    }

    const { scaleX, scaleY } = getScale()

    if (drawingShape?.type === 'rectangle' && newRectIdRef.current) {
      const nRect = getRectangleById(newRectIdRef.current)
      newRectIdRef.current = null

      if (!orgId || !projectId || !fileId || !nRect) return

      if (nRect.height === 0 || nRect.width === 0) {
        deleteRect(nRect.id)
        useFilesStore.getState().deleteShapeFromFile(fileId, nRect.id, 'rectangle')
        return
      }

      const x = nRect.x / scaleX
      const y = nRect.y / scaleY
      const height = nRect.height / scaleY
      const width = nRect.width / scaleX

      // In UI, the height and width might be negative, So we need to calculate the correct x, y, height and width
      const dx = x + width
      const dy = y + height
      const x1 = Math.min(x, dx)
      const y1 = Math.min(y, dy)
      const x2 = Math.max(x, dx)
      const y2 = Math.max(y, dy)
      const w = x2 - x1
      const h = y2 - y1

      const cShape: Omit<ShapeType, 'id'> = {
        ...nRect,
        x: x1,
        y: y1,
        height: h,
        width: w,
        stroke: selectedColor,
        strokeWidth: 2,
        color: selectedColor,
        type: 'rectangle',
        orgId,
        projectId,
        fileId,
        atFrame: 1
      }
      createShapeMutate({
        orgId,
        projectId,
        fileId,
        shape: cShape
      })
      useFilesStore.getState().addShapeToFile(fileId, 'rectangle', cShape as ShapeType)
    }
  }, [getCursorPosition, getScale, drawingShape, selectedColor, aiPoints, fileId, orgId, projectId])

  const handleMouseDown = useCallback(() => {
    const pos = getCursorPosition()
    if (!pos) return

    if (drawingShape?.type === 'ai') {
      setAIPoints({ x1: pos.x, y1: pos.y })
    }

    if (drawingShape?.type === 'rectangle') {
      const rectId = generateId()
      newRectIdRef.current = rectId
      const newRect = {
        id: rectId,
        x: pos.x,
        y: pos.y,
        height: 0,
        width: 0,
        name: `Rectangle ${rectangles.length + 1}`,
        notes: '',
        orgId: orgId!,
        projectId: projectId!,
        fileId: fileId!
      }
      addRectangle({
        ...newRect,
        stroke: selectedColor,
        strokeWidth: 2,
        classId: selectedClass?.id
      })
    }
  }, [
    getCursorPosition,
    drawingShape,
    orgId,
    projectId,
    fileId,
    rectangles,
    selectedColor,
    selectedClass
  ])

  useEffect(() => {
    if (!stageRef.current) return

    const stage = stageRef.current
    stage.addEventListener('mousemove', handleMouseMove)
    stage.addEventListener('mouseup', handleMouseUp)
    stage.addEventListener('mousedown', handleMouseDown)
    stage.addEventListener('mouseup', drawPolygon)

    return () => {
      stage.removeEventListener('mousemove')
      stage.removeEventListener('mouseup')
      stage.removeEventListener('mousedown')
    }
  }, [handleMouseMove, handleMouseUp, handleMouseDown, drawPolygon])

  // const onAddCircle = () => {
  //   const newCircle = {
  //     id: generateId(),
  //     x: 50,
  //     y: 50,
  //     height: 100,
  //     width: 100,
  //     name: `Circle ${circles.length + 1}`,
  //     notes: '',
  //     orgId: orgId!,
  //     projectId: projectId!,
  //     fileId: fileId!
  //   }
  //   addCircle({ ...newCircle, stroke: selectedColor, strokeWidth: 2 })

  //   if (!orgId || !projectId || !fileId || !newCircle) return

  //   const { scaleX, scaleY } = getScale()

  // const x = newCircle.x / scaleX
  // const y = newCircle.y / scaleY
  // const height = newCircle.height / scaleY
  // const width = newCircle.width / scaleX

  // // In UI, the height and width might be negative, So we need to calculate the correct x, y, height and width
  // const dx = x + width
  // const dy = y + height
  // const x1 = Math.min(x, dx)
  // const y1 = Math.min(y, dy)
  // const x2 = Math.max(x, dx)
  // const y2 = Math.max(y, dy)
  // const w = x2 - x1
  // const h = y2 - y1
  //   const cShape: Omit<ShapeType, 'id'> = {
  //     ...newCircle,
  //     x: x1,
  //     y: y1,
  //     height: h,
  //     width: w,
  //     stroke: selectedColor,
  //     strokeWidth: 2,
  //     color: selectedColor,
  //     type: 'circle',
  //     orgId,
  //     projectId,
  //     fileId,
  //     atFrame: 1
  //   }
  //   createShapeMutate({
  //     orgId,
  //     projectId,
  //     fileId,
  //     shape: cShape
  //   })
  //   useFilesStore.getState().addShapeToFile(fileId, 'circle', cShape as ShapeType)
  // }

  // const onAddFace = (e: MouseEvent<HTMLButtonElement>) => {
  //   e.stopPropagation()
  //   const allPoints = [
  //     { x: 464, y: 61, id: generateId() }, // 0
  //     { x: 555, y: 101, id: generateId() }, // 1
  //     { x: 563, y: 196, id: generateId() }, // 2
  //     { x: 546, y: 288, id: generateId() }, // 3
  //     { x: 468, y: 330, id: generateId() }, // 4
  //     { x: 376, y: 279, id: generateId() }, // 5
  //     { x: 364, y: 202, id: generateId() }, // 6
  //     { x: 387, y: 92, id: generateId() }, // 7
  //     { x: 449, y: 144, id: generateId() }, // 8
  //     { x: 402, y: 135, id: generateId() }, // 9
  //     { x: 380, y: 162, id: generateId() }, // 10
  //     { x: 497, y: 146, id: generateId() }, // 11
  //     { x: 534, y: 137, id: generateId() }, // 12
  //     { x: 556, y: 168, id: generateId() }, // 13
  //     { x: 538, y: 168, id: generateId() }, // 14
  //     { x: 515, y: 158, id: generateId() }, // 15
  //     { x: 497, y: 168, id: generateId() }, // 16
  //     { x: 518, y: 174, id: generateId() }, // 17
  //     { x: 516, y: 166, id: generateId() }, // 18
  //     { x: 441, y: 165, id: generateId() }, // 19
  //     { x: 417, y: 154, id: generateId() }, // 20
  //     { x: 397, y: 167, id: generateId() }, // 21
  //     { x: 423, y: 173, id: generateId() }, // 22
  //     { x: 420, y: 164, id: generateId() }, // 23
  //     { x: 439, y: 214, id: generateId() }, // 24
  //     { x: 470, y: 210, id: generateId() }, // 25
  //     { x: 498, y: 219, id: generateId() }, // 26
  //     { x: 516, y: 256, id: generateId() }, // 27
  //     { x: 469, y: 251, id: generateId() }, // 28
  //     { x: 423, y: 256, id: generateId() }, // 29
  //     { x: 468, y: 273, id: generateId() } // 30
  //   ]

  //   addFace({
  //     id: generateId(),
  //     name: `Face ${faces.length + 1}`,
  //     notes: '',
  //     points: allPoints,
  //     stroke: selectedColor,
  //     strokeWidth: 2,
  //     closed: false
  //   })
  // }

  const togglePolygonStartAndEnd = () => {
    lastUsedShape.current = 'polygon'

    if (drawingShape?.type === 'line') {
      finalizeLine()
    }

    if (drawingShape?.type === 'polygon' && drawingShape.id !== null) {
      finalizePolygon()
    } else if (drawingShape?.type === 'polygon' && drawingShape.id === null) {
      setDrawingShape(null)
    } else {
      setDrawingShape({ type: 'polygon', id: null })
    }
  }

  const toggleLineStatAndEnd = () => {
    lastUsedShape.current = 'line'

    if (drawingShape?.type === 'polygon') {
      finalizePolygon()
    }

    if (drawingShape?.type === 'line' && drawingShape.id !== null) {
      finalizeLine()
    } else if (drawingShape?.type === 'line' && drawingShape.id === null) {
      setDrawingShape(null)
    } else {
      setDrawingShape({ type: 'line', id: null })
    }
  }

  const toggleAIBox = () => {
    lastUsedShape.current = 'ai'

    if (drawingShape?.type === 'ai') {
      setDrawingShape(null)
    } else {
      setDrawingShape({ type: 'ai', id: null })
    }
  }

  const toggleAddRect = () => {
    lastUsedShape.current = 'rectangle'

    if (drawingShape?.type === 'rectangle') {
      setDrawingShape(null)
    } else {
      setDrawingShape({ type: 'rectangle', id: null })
    }
  }

  const handleEsc = () => {
    if (drawingShape) {
      setDrawingShape(null)
      setSelectedShape(null)
      setSelectedLinePoint(null)
      setSelectedPolyPoint(null)
    } else {
      setDrawingShape({ type: lastUsedShape.current, id: null })
    }

    if (newRectIdRef.current && fileId) {
      deleteRect(newRectIdRef.current)
      useFilesStore.getState().deleteShapeFromFile(fileId, newRectIdRef.current, 'rectangle')
    }
  }

  useHotkeys(['esc'], handleEsc)
  useHotkeys(['r'], toggleAddRect)
  // useHotkeys(['c'], onAddCircle)
  useHotkeys(['a'], toggleAIBox)
  useHotkeys(['p'], togglePolygonStartAndEnd)
  useHotkeys(['l'], toggleLineStatAndEnd)

  return (
    <div className="w-full h-full flex flex-row items-center text-center gap-3">
      <Tooltip tooltipChildren={<HoverText>Add Rectangle</HoverText>} align="bottom" move={10}>
        <button
          onClick={toggleAddRect}
          className={cn('rounded-lg p-3 hover:bg-brand', {
            'text-white bg-brand': drawingShape?.type === 'rectangle'
          })}
        >
          <BiShapeSquare size={30} color="white" />
        </button>
      </Tooltip>

      {/* <Tooltip tooltipChildren={<HoverText>Add Circle</HoverText>} align="left" move={10}>
        <button
          onClick={onAddCircle}
          className={cn('rounded-lg p-3 hover:bg-brand', {
            'text-white bg-brand': isDrawingCircle
          })}
        >
          <BsCircle size={30} color="white" />
        </button>
      </Tooltip> */}

      <Tooltip tooltipChildren={<HoverText>Add Polygon</HoverText>} align="bottom" move={10}>
        <button
          onClick={togglePolygonStartAndEnd}
          className={cn('rounded-lg p-3 hover:bg-brand', {
            'text-white bg-brand': drawingShape?.type === 'polygon'
          })}
        >
          <BiShapePolygon size={30} color="white" />
        </button>
      </Tooltip>

      <Tooltip tooltipChildren={<HoverText>Add Line</HoverText>} align="bottom" move={10}>
        <button
          onClick={toggleLineStatAndEnd}
          className={cn('rounded-lg p-3 hover:bg-brand', {
            'text-white bg-brand': drawingShape?.type === 'line'
          })}
        >
          <TbShape2 size={30} color="white" />
        </button>
      </Tooltip>
    </div>
  )
}

export default AnnotationToolbar
