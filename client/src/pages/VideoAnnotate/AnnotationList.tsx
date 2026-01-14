import { FC, Fragment, useState, MouseEvent, RefObject } from 'react'
import { HiPencil } from 'react-icons/hi'
import { FaTrashAlt } from 'react-icons/fa'
import { cn } from '@renderer/utils/cn'
import { IoMdTrash } from 'react-icons/io'
import { useHotkeys } from 'react-hotkeys-hook'
import { useMutation } from '@tanstack/react-query'

import PolygonType from '@models/Polygon.model'
import RectangleType from '@models/Rectangle.model'
import CircleType from '@models/Circle.model'
import FaceType from '@models/Face.model'
import EditModal from '@/components/modals/EditModal'
import LineType from '@models/Line.model'
import { shapesService } from '@/services/supabase'
import { ShapeType } from '@models/Shape.model'
import PointType from '@models/Point.model'
import Tooltip from '@/components/ui/Tooltip'
import HoverText from '@/components/ui/HoverText'
import { calculateFrame } from './helpers/helpers'
import { useUntrackedVideoStore, useVideoStore } from './store/video.store'
import { useFilesStore } from '@renderer/store/files.store'

type AnnotationListProps = {
  videoRef: RefObject<HTMLVideoElement>
  onAddPolyPoints: (polyId: string) => void
  onAddLinePoints: (lineId: string) => void
}
const AnnotationList: FC<AnnotationListProps> = ({
  onAddLinePoints,
  onAddPolyPoints,
  videoRef
}) => {
  const [editPoly, setEditPoly] = useState<PolygonType | null>(null)
  const [editRect, setEditRect] = useState<RectangleType | null>(null)
  const [editCircle, setEditCircle] = useState<CircleType | null>(null)
  const [editFace, setEditFace] = useState<FaceType | null>(null)
  const [editLine, setEditLine] = useState<LineType | null>(null)

  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id

  const updateShapeMutation = useMutation({
    mutationFn: ({ shapeId, data }: { shapeId: string; data: Parameters<typeof shapesService.updateShape>[1] }) =>
      shapesService.updateShape(shapeId, data)
  })

  const deleteShapeMutation = useMutation({
    mutationFn: (shapeId: string) => shapesService.deleteShape(shapeId)
  })

  const getAllPolygons = useVideoStore((s) => s.getAllPolygons)
  const updatePolygon = useVideoStore((s) => s.updatePolygon)
  const deletePolygon = useVideoStore((s) => s.deletePolygon)
  const getAllRectangles = useVideoStore((s) => s.getAllRectangles)
  const deleteRectangle = useVideoStore((s) => s.deleteRectangle)
  const updateRectangle = useVideoStore((s) => s.updateRectangle)
  const getAllCircles = useVideoStore((s) => s.getAllCircles)
  const deleteCircle = useVideoStore((s) => s.deleteCircle)
  const updateCircle = useVideoStore((s) => s.updateCircle)
  const getAllFaces = useVideoStore((s) => s.getAllFaces)
  const deleteFace = useVideoStore((s) => s.deleteFace)
  const updateFace = useVideoStore((s) => s.updateFace)
  const getAllLines = useVideoStore((s) => s.getAllLines)
  const updateLine = useVideoStore((s) => s.updateLine)
  const deleteLine = useVideoStore((s) => s.deleteLine)
  const deletePointFromLine = useVideoStore((s) => s.deletePointFromLine)
  const deletePointFromPolygon = useVideoStore((s) => s.deletePointFromPolygon)

  const selectedPolyPoint = useUntrackedVideoStore((s) => s.selectedPolyPoint)
  const setSelectedPolyPoint = useUntrackedVideoStore((s) => s.setSelectedPolyPoint)
  const setSelectedPolyId = useUntrackedVideoStore((s) => s.setSelectedPolyId)
  const selectedPolygonId = useUntrackedVideoStore((s) => s.selectedPolyId)
  const selectedRectangleId = useUntrackedVideoStore((s) => s.selectedRectangleId)
  const setSelectedRectangleId = useUntrackedVideoStore((s) => s.setSelectedRectangleId)
  const selectedCircleId = useUntrackedVideoStore((s) => s.selectedCircleId)
  const setSelectedCircleId = useUntrackedVideoStore((s) => s.setSelectedCircleId)
  const selectedFaceId = useUntrackedVideoStore((s) => s.selectedFaceId)
  const setSelectedFaceId = useUntrackedVideoStore((s) => s.setSelectedFaceId)
  const selectedLinePoint = useUntrackedVideoStore((s) => s.selectedLinePoint)
  const setSelectedLinePoint = useUntrackedVideoStore((s) => s.setSelectedLinePoint)
  const setSelectedLineId = useUntrackedVideoStore((s) => s.setSelectedLineId)
  const selectedLineId = useUntrackedVideoStore((s) => s.selectedLineId)

  const calculateCurrentFrame = () => {
    if (!videoRef.current || !fileObj || !fileObj.fps) return 0
    const frame = calculateFrame(videoRef.current.currentTime, fileObj.fps)
    return frame
  }

  const handleCancel = () => {
    if (editLine) {
      setEditLine(null)
    }

    if (editPoly) {
      setEditPoly(null)
    }

    if (editRect) {
      setEditRect(null)
    }

    if (editCircle) {
      setEditCircle(null)
    }

    if (editFace) {
      setEditFace(null)
    }
  }

  const updateNameAndNotes = (
    name: string,
    notes: string,
    classId?: string,
    attribute?: string,
    text?: string,
    ID?: string,
    color?: string
  ) => {
    let shapeId: string | null = null
    const updateData = {
      name,
      notes,
      classId,
      attribute,
      text,
      ID,
      stroke: color || 'rgb(255, 0, 0)'
    }

    const currentFrame = calculateCurrentFrame()
    if (editLine) {
      updateLine(currentFrame, editLine.id, { ...editLine, ...updateData })
      shapeId = editLine.id
    }

    if (editPoly) {
      updatePolygon(currentFrame, editPoly.id, { ...editPoly, ...updateData })
      shapeId = editPoly.id
    }

    if (editRect) {
      updateRectangle(currentFrame, editRect.id, { ...editRect, ...updateData })
      shapeId = editRect.id
    }

    if (editCircle) {
      updateCircle(currentFrame, editCircle.id, { ...editCircle, ...updateData })
      shapeId = editCircle.id
    }

    if (editFace) {
      updateFace(currentFrame, editFace.id, { ...editFace, ...updateData })
      shapeId = editFace.id
    }

    handleCancel()

    if (!fileId || !shapeId) return
    updateShapeMutation.mutate({
      shapeId,
      data: {
        name: updateData.name,
        notes: updateData.notes,
        classId: updateData.classId,
        attribute: updateData.attribute,
        textField: updateData.text,
        idField: updateData.ID,
        stroke: updateData.stroke
      }
    })
  }

  const handleSelectPoly = (polyId: string) => () => {
    setSelectedPolyId(polyId)

    if (selectedLineId) {
      setSelectedLineId(null)
    }

    if (selectedRectangleId) {
      setSelectedRectangleId(null)
    }

    if (selectedCircleId) {
      setSelectedCircleId(null)
    }

    if (selectedFaceId) {
      setSelectedFaceId(null)
    }
  }
  const handleSelectRect = (rectId: string) => () => {
    setSelectedRectangleId(rectId)

    if (selectedLineId) {
      setSelectedLineId(null)
    }

    if (selectedPolygonId) {
      setSelectedPolyId(null)
    }

    if (selectedCircleId) {
      setSelectedCircleId(null)
    }

    if (selectedFaceId) {
      setSelectedFaceId(null)
    }
  }
  const handleSelectCircle = (circleId: string) => () => {
    setSelectedCircleId(circleId)

    if (selectedLineId) {
      setSelectedLineId(null)
    }

    if (selectedPolygonId) {
      setSelectedPolyId(null)
    }

    if (selectedRectangleId) {
      setSelectedRectangleId(null)
    }

    if (selectedFaceId) {
      setSelectedFaceId(null)
    }
  }

  const handleSelectFace = (faceId: string) => () => {
    setSelectedFaceId(faceId)

    if (selectedLineId) {
      setSelectedLineId(null)
    }

    if (selectedPolygonId) {
      setSelectedPolyId(null)
    }

    if (selectedRectangleId) {
      setSelectedRectangleId(null)
    }

    if (selectedCircleId) {
      setSelectedCircleId(null)
    }
  }

  const handleSelectLine = (lineId: string) => () => {
    setSelectedLineId(lineId)

    if (selectedPolygonId) {
      setSelectedPolyId(null)
    }

    if (selectedRectangleId) {
      setSelectedRectangleId(null)
    }

    if (selectedCircleId) {
      setSelectedCircleId(null)
    }

    if (selectedFaceId) {
      setSelectedFaceId(null)
    }
  }

  const handleEditPolygon = (poly: PolygonType) => (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setEditPoly(poly)

    if (editLine) {
      setEditLine(null)
    }

    if (editRect) {
      setEditRect(null)
    }

    if (editCircle) {
      setEditCircle(null)
    }

    if (editFace) {
      setEditFace(null)
    }
  }

  const handleEditLine = (line: LineType) => (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setEditLine(line)

    if (editPoly) {
      setEditPoly(null)
    }

    if (editRect) {
      setEditRect(null)
    }

    if (editCircle) {
      setEditCircle(null)
    }

    if (editFace) {
      setEditFace(null)
    }
  }

  const handleEditRectangle = (rect: RectangleType) => (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setEditRect(rect)

    if (editLine) {
      setEditLine(null)
    }

    if (editPoly) {
      setEditPoly(null)
    }

    if (editCircle) {
      setEditCircle(null)
    }

    if (editFace) {
      setEditFace(null)
    }
  }

  const handleEditCircle = (circle: CircleType) => (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setEditCircle(circle)

    if (editLine) {
      setEditLine(null)
    }

    if (editPoly) {
      setEditPoly(null)
    }

    if (editRect) {
      setEditRect(null)
    }

    if (editFace) {
      setEditFace(null)
    }
  }

  const handleEditFace = (face: FaceType) => (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    setEditFace(face)

    if (editLine) {
      setEditLine(null)
    }

    if (editPoly) {
      setEditPoly(null)
    }

    if (editRect) {
      setEditRect(null)
    }

    if (editCircle) {
      setEditCircle(null)
    }
  }

  const handleDeleteShortcut = () => {
    let shapeId: string | null = null
    const currentFrame = calculateCurrentFrame()

    if (selectedPolygonId) {
      shapeId = selectedPolygonId
      deletePolygon(currentFrame, selectedPolygonId)
    }

    if (selectedRectangleId) {
      shapeId = selectedRectangleId
      deleteRectangle(currentFrame, selectedRectangleId)
    }

    if (selectedCircleId) {
      shapeId = selectedCircleId
      deleteCircle(currentFrame, selectedCircleId)
    }

    if (selectedFaceId) {
      shapeId = selectedFaceId
      deleteFace(currentFrame, selectedFaceId)
    }

    if (selectedLineId) {
      shapeId = selectedLineId
      deleteLine(currentFrame, selectedLineId)
    }

    if (fileId && shapeId) {
      deleteShapeMutation.mutate(shapeId)
    }
  }
  useHotkeys(['delete', 'backspace'], handleDeleteShortcut, [handleDeleteShortcut])

  const handleDeleteShape = (shapeId: string, shapeType: ShapeType['type']) => () => {
    const currentFrame = calculateCurrentFrame()

    if (shapeType === 'polygon') {
      deletePolygon(currentFrame, shapeId)
    }

    if (shapeType === 'rectangle') {
      deleteRectangle(currentFrame, shapeId)
    }

    if (shapeType === 'circle') {
      deleteCircle(currentFrame, shapeId)
    }

    if (shapeType === 'face') {
      deleteFace(currentFrame, shapeId)
    }

    if (shapeType === 'line') {
      deleteLine(currentFrame, shapeId)
    }

    if (fileId && shapeId) {
      deleteShapeMutation.mutate(shapeId)
    }
  }

  const getPointsScaled = (pts: PointType[]) => {
    const imgEle = videoRef.current
    if (!imgEle) return pts

    const scaleX = imgEle.offsetWidth / imgEle.videoWidth
    const scaleY = imgEle.offsetHeight / imgEle.videoHeight

    return pts.map((p) => ({ ...p, x: p.x / scaleX, y: p.y / scaleY }))
  }

  const handleDeletePoint = () => {
    let uShape: PolygonType | LineType | null = null
    const currentFrame = calculateCurrentFrame()

    if (selectedPolyPoint) {
      uShape = deletePointFromPolygon(
        currentFrame,
        selectedPolyPoint.polyId,
        selectedPolyPoint.pointId
      )
      setSelectedPolyPoint(null)
    }

    if (selectedLinePoint) {
      uShape = deletePointFromLine(
        currentFrame,
        selectedLinePoint.lineId,
        selectedLinePoint.pointId
      )
      setSelectedLinePoint(null)
    }

    if (!fileId || !uShape) return
    updateShapeMutation.mutate({
      shapeId: uShape.id,
      data: { points: getPointsScaled(uShape.points) }
    })
  }

  return (
    <Fragment>
      {!!editPoly && (
        <EditModal
          title="Edit Polygon"
          isOpen
          shapeId={editPoly.id}
          name={editPoly.name}
          notes={editPoly.notes}
          onCancel={handleCancel}
          onEdit={updateNameAndNotes}
          onAddPoints={onAddPolyPoints}
          classId={editPoly.classId}
          text={editPoly.text}
          attribute={editPoly.attribute}
          ID={editPoly.ID}
        />
      )}

      {!!editLine && (
        <EditModal
          title="Edit Line"
          isOpen
          shapeId={editLine.id}
          name={editLine.name}
          notes={editLine.notes}
          onCancel={handleCancel}
          onEdit={updateNameAndNotes}
          onAddPoints={onAddLinePoints}
          classId={editLine.classId}
          text={editLine.text}
          attribute={editLine.attribute}
          ID={editLine.ID}
        />
      )}

      {!!editRect && (
        <EditModal
          title="Edit Rectangle"
          name={editRect.name}
          notes={editRect.notes}
          isOpen
          onCancel={handleCancel}
          onEdit={updateNameAndNotes}
          classId={editRect.classId}
          text={editRect.text}
          attribute={editRect.attribute}
          ID={editRect.ID}
        />
      )}

      {!!editCircle && (
        <EditModal
          title="Edit Circle"
          name={editCircle.name}
          notes={editCircle.notes}
          isOpen
          onCancel={handleCancel}
          onEdit={updateNameAndNotes}
          classId={editCircle.classId}
          text={editCircle.text}
          attribute={editCircle.attribute}
          ID={editCircle.ID}
        />
      )}

      {!!editFace && (
        <EditModal
          title="Edit Face"
          name={editFace.name}
          notes={editFace.notes}
          isOpen
          onCancel={handleCancel}
          onEdit={updateNameAndNotes}
          classId={editFace.classId}
          text={editFace.text}
          attribute={editFace.attribute}
          ID={editFace.ID}
        />
      )}

      <div className="h-full overflow-y-scroll">
        {(selectedPolyPoint || selectedLinePoint) && (
          <button
            onClick={handleDeletePoint}
            className="w-full flex justify-center text-red-500 bg-gray-200 rounded-lg p-2 mb-3 items-center text-ellipsis overflow-hidden whitespace-nowrap disabled:opacity-50"
          >
            <IoMdTrash color="red" size={20} />
            <div className="w-2" />
            Delete point
          </button>
        )}

        {getAllPolygons().map((polygon) => (
          <div
            onClick={handleSelectPoly(polygon.id)}
            key={polygon.id}
            className={cn('w-full flex gap-2 bg-gray-200 py-2 px-3 rounded-lg mb-3 border-2', {
              'border-gray-400': selectedPolygonId === polygon.id,
              'border-transparent': selectedPolygonId !== polygon.id
            })}
          >
            <div className="w-36 text-ellipsis overflow-hidden whitespace-nowrap">
              <p>{polygon.name}</p>
            </div>
            <div className="grow" />
            <button onClick={handleEditPolygon(polygon)}>
              <Tooltip tooltipChildren={<HoverText>Edit</HoverText>} align="bottom">
                <HiPencil size={20} />
              </Tooltip>
            </button>
            <button className="ml-2" onClick={handleDeleteShape(polygon.id, 'polygon')}>
              <Tooltip tooltipChildren={<HoverText>Delete</HoverText>} align="bottom-end">
                <FaTrashAlt size={17} />
              </Tooltip>
            </button>
          </div>
        ))}

        {getAllRectangles().map((rect) => (
          <div
            onClick={handleSelectRect(rect.id)}
            key={rect.id}
            className={cn('w-full flex gap-2 bg-gray-200 py-2 px-3 rounded-lg mb-3 border-2', {
              'border-gray-400': selectedRectangleId === rect.id,
              'border-transparent': selectedRectangleId !== rect.id
            })}
          >
            <div className="w-36 text-ellipsis overflow-hidden whitespace-nowrap">{rect.name}</div>
            <div className="grow" />
            <button onClick={handleEditRectangle(rect)}>
              <Tooltip tooltipChildren={<HoverText>Edit</HoverText>} align="bottom">
                <HiPencil size={20} />
              </Tooltip>
            </button>
            <button className="ml-2" onClick={handleDeleteShape(rect.id, 'rectangle')}>
              <Tooltip tooltipChildren={<HoverText>Delete</HoverText>} align="bottom-end">
                <FaTrashAlt size={17} />
              </Tooltip>
            </button>
          </div>
        ))}

        {getAllCircles().map((circle) => (
          <div
            onClick={handleSelectCircle(circle.id)}
            key={circle.id}
            className={cn('w-full flex gap-2 bg-gray-200 py-2 px-3 rounded-lg mb-3 border-2', {
              'border-gray-400': selectedCircleId === circle.id,
              'border-transparent': selectedCircleId !== circle.id
            })}
          >
            <div className="w-36 text-ellipsis overflow-hidden whitespace-nowrap">
              {circle.name}
            </div>
            <div className="grow" />
            <button onClick={handleEditCircle(circle)}>
              <Tooltip tooltipChildren={<HoverText>Edit</HoverText>} align="bottom">
                <HiPencil size={20} />
              </Tooltip>
            </button>
            <button className="ml-2" onClick={handleDeleteShape(circle.id, 'circle')}>
              <Tooltip tooltipChildren={<HoverText>Delete</HoverText>} align="bottom-end">
                <FaTrashAlt size={17} />
              </Tooltip>
            </button>
          </div>
        ))}

        {getAllFaces().map((face) => (
          <div
            onClick={handleSelectFace(face.id)}
            key={face.id}
            className={cn(
              'w-full flex gap-2 bg-gray-200 py-2 px-3 rounded-lg mb-3 border-2 last:mb-0',
              {
                'border-gray-400': selectedFaceId === face.id,
                'border-transparent': selectedFaceId !== face.id
              }
            )}
          >
            <div className="w-36 text-ellipsis overflow-hidden whitespace-nowrap">{face.name}</div>
            <div className="grow" />
            <button onClick={handleEditFace(face)}>
              <Tooltip tooltipChildren={<HoverText>Edit</HoverText>} align="bottom">
                <HiPencil size={20} />
              </Tooltip>
            </button>
            <button className="ml-2" onClick={handleDeleteShape(face.id, 'face')}>
              <Tooltip tooltipChildren={<HoverText>Delete</HoverText>} align="bottom-end">
                <FaTrashAlt size={17} />
              </Tooltip>
            </button>
          </div>
        ))}

        {getAllLines().map((line) => (
          <div
            onClick={handleSelectLine(line.id)}
            key={line.id}
            className={cn(
              'w-full flex gap-2 bg-gray-200 py-2 px-3 rounded-lg mb-3 border-2 last:mb-0',
              {
                'border-gray-400': selectedLineId === line.id,
                'border-transparent': selectedLineId !== line.id
              }
            )}
          >
            <div className="w-36 text-ellipsis overflow-hidden whitespace-nowrap">{line.name}</div>
            <div className="grow" />
            <button onClick={handleEditLine(line)}>
              <Tooltip tooltipChildren={<HoverText>Edit</HoverText>} align="bottom">
                <HiPencil size={20} />
              </Tooltip>
            </button>
            <button className="ml-2" onClick={handleDeleteShape(line.id, 'line')}>
              <Tooltip tooltipChildren={<HoverText>Delete</HoverText>} align="bottom-end">
                <FaTrashAlt size={17} />
              </Tooltip>
            </button>
          </div>
        ))}
      </div>
    </Fragment>
  )
}

export default AnnotationList
