import { FC, Fragment, useState, MouseEvent, RefObject } from 'react'
import { HiPencil } from 'react-icons/hi'
import { FaTrashAlt } from 'react-icons/fa'
import { cn } from '@renderer/utils/cn'

import { IoMdTrash } from 'react-icons/io'
import { useHotkeys } from 'react-hotkeys-hook'

import PolygonType from '@models/Polygon.model'
import RectangleType from '@models/Rectangle.model'
import CircleType from '@models/Circle.model'
import FaceType from '@models/Face.model'
import EditModal from '@renderer/components/EditModal'
import LineType from '@models/Line.model'
import { useMutation } from '@tanstack/react-query'
import { deleteShape, updateShape } from '@renderer/helpers/axiosRequests'
import { useOrgStore } from '@renderer/store/organization.store'
import { useParams } from 'react-router-dom'
import { ShapeType } from '@models/Shape.model'
import PointType from '@models/Point.model'
import Tooltip from '@renderer/components/common/Tooltip'
import HoverText from '@renderer/components/common/HoverText'
import { useFilesStore } from '@renderer/store/files.store'
import { useImageStore, useImageUntrackedStore } from './store/image.store'

type AnnotationListProps = {
  imgRef: RefObject<HTMLImageElement>
  onAddPolyPoints: (polyId: string) => void
  onAddLinePoints: (lineId: string) => void
}
const AnnotationList: FC<AnnotationListProps> = ({ onAddLinePoints, onAddPolyPoints, imgRef }) => {
  const [editPoly, setEditPoly] = useState<PolygonType | null>(null)
  const [editRect, setEditRect] = useState<RectangleType | null>(null)
  const [editCircle, setEditCircle] = useState<CircleType | null>(null)
  const [editFace, setEditFace] = useState<FaceType | null>(null)
  const [editLine, setEditLine] = useState<LineType | null>(null)

  const orgId = useOrgStore((s) => s.selectedOrg)
  const { projectid: projectId } = useParams()
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id
  const { mutate: updateShapeMutate } = useMutation(updateShape)
  const { mutate: deleteShapeMutate } = useMutation(deleteShape)

  const selectedShape = useImageUntrackedStore((s) => s.selectedShape)
  const setSelectedShape = useImageUntrackedStore((s) => s.setSelectedShape)

  const polygons = useImageStore((s) => s.polygons)
  const updatePolygon = useImageStore((s) => s.updatePolygon)
  const deletePolygon = useImageStore((s) => s.deletePolygon)
  const selectedPolyPoint = useImageUntrackedStore((s) => s.selectedPolyPoint)
  const setSelectedPolyPoint = useImageUntrackedStore((s) => s.setSelectedPolyPoint)
  const deletePointFromPolygon = useImageStore((s) => s.deletePointFromPolygon)

  const rectangles = useImageStore((s) => s.rectangles)
  const deleteRectangle = useImageStore((s) => s.deleteRectangle)
  const updateRectangle = useImageStore((s) => s.updateRectangle)

  const circles = useImageStore((s) => s.circles)
  const deleteCircle = useImageStore((s) => s.deleteCircle)
  const updateCircle = useImageStore((s) => s.updateCircle)

  const faces = useImageStore((s) => s.faces)
  const deleteFace = useImageStore((s) => s.deleteFace)
  const updateFace = useImageStore((s) => s.updateFace)

  const lines = useImageStore((s) => s.lines)
  const updateLine = useImageStore((s) => s.updateLine)
  const deleteLine = useImageStore((s) => s.deleteLine)
  const selectedLinePoint = useImageUntrackedStore((s) => s.selectedLinePoint)
  const setSelectedLinePoint = useImageUntrackedStore((s) => s.setSelectedLinePoint)
  const deletePointFromLine = useImageStore((s) => s.deletePointFromLine)

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
    let shapeType: ShapeType['type'] | null = null

    const updateData = {
      name,
      notes,
      classId,
      attribute,
      text,
      ID,
      stroke: color || 'rgb(255, 0, 0)'
    }

    if (editLine) {
      updateLine(editLine.id, { ...editLine, ...updateData })
      shapeId = editLine.id
      shapeType = 'line'
    }

    if (editPoly) {
      updatePolygon(editPoly.id, { ...editPoly, ...updateData })
      shapeId = editPoly.id
      shapeType = 'polygon'
    }

    if (editRect) {
      updateRectangle(editRect.id, { ...editRect, ...updateData })
      shapeId = editRect.id
      shapeType = 'rectangle'
    }

    if (editCircle) {
      updateCircle(editCircle.id, { ...editCircle, ...updateData })
      shapeId = editCircle.id
      shapeType = 'circle'
    }

    if (editFace) {
      updateFace(editFace.id, { ...editFace, ...updateData })
      shapeId = editFace.id
      shapeType = 'face'
    }

    handleCancel()

    if (!orgId || !projectId || !fileId || !shapeId || !shapeType) return
    updateShapeMutate({ orgId, projectId, fileId, shapeId, shape: { ...updateData } })
    useFilesStore.getState().updateFileShapes(fileId, shapeId, shapeType, { ...updateData })
  }

  const handleSelectPoly = (polyId: string) => () => {
    setSelectedShape({ type: 'polygon', id: polyId })
  }
  const handleSelectRect = (rectId: string) => () => {
    setSelectedShape({ type: 'rectangle', id: rectId })
  }
  const handleSelectCircle = (circleId: string) => () => {
    setSelectedShape({ type: 'circle', id: circleId })
  }

  const handleSelectFace = (faceId: string) => () => {
    setSelectedShape({ type: 'face', id: faceId })
  }

  const handleSelectLine = (lineId: string) => () => {
    setSelectedShape({ type: 'line', id: lineId })
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
    if (selectedLinePoint || selectedPolyPoint) {
      handleDeletePoint()
      return
    }

    if (selectedShape?.type === 'polygon') {
      deletePolygon(selectedShape.id)
    }

    if (selectedShape?.type === 'rectangle') {
      deleteRectangle(selectedShape.id)
    }

    if (selectedShape?.type === 'circle') {
      deleteCircle(selectedShape.id)
    }

    if (selectedShape?.type === 'face') {
      deleteFace(selectedShape.id)
    }

    if (selectedShape?.type === 'line') {
      deleteLine(selectedShape.id)
    }

    if (orgId && projectId && fileId && selectedShape) {
      deleteShapeMutate({ orgId, projectId, fileId, shapeId: selectedShape.id })
      useFilesStore.getState().deleteShapeFromFile(fileId, selectedShape.id, selectedShape.type)
    }
  }
  useHotkeys(['delete', 'd', 'backspace'], handleDeleteShortcut, [handleDeleteShortcut])

  const handleDeleteShape = (shapeId: string, shapeType: ShapeType['type']) => () => {
    if (shapeType === 'polygon') {
      deletePolygon(shapeId)
    }

    if (shapeType === 'rectangle') {
      deleteRectangle(shapeId)
    }

    if (shapeType === 'circle') {
      deleteCircle(shapeId)
    }

    if (shapeType === 'face') {
      deleteFace(shapeId)
    }

    if (shapeType === 'line') {
      deleteLine(shapeId)
    }

    if (orgId && projectId && fileId && shapeId) {
      deleteShapeMutate({ orgId, projectId, fileId, shapeId })
      useFilesStore.getState().deleteShapeFromFile(fileId, shapeId, shapeType)
    }
  }

  const getPointsScaled = (pts: PointType[]) => {
    const imgEle = imgRef.current
    if (!imgEle) return pts

    const scaleX = imgEle.offsetWidth / imgEle.naturalWidth
    const scaleY = imgEle.offsetHeight / imgEle.naturalHeight
    return pts.map((p) => ({ ...p, x: p.x / scaleX, y: p.y / scaleY }))
  }

  const handleDeletePoint = () => {
    let uShape: PolygonType | LineType | null = null
    let shapeType: ShapeType['type'] | null = null

    if (selectedPolyPoint) {
      shapeType = 'polygon'
      uShape = deletePointFromPolygon(selectedPolyPoint.polyId, selectedPolyPoint.pointId)
      setSelectedPolyPoint(null)
    }

    if (selectedLinePoint) {
      shapeType = 'line'
      uShape = deletePointFromLine(selectedLinePoint.lineId, selectedLinePoint.pointId)
      setSelectedLinePoint(null)
    }

    if (!orgId || !projectId || !fileId || !uShape || !shapeType) return
    updateShapeMutate({
      orgId,
      projectId,
      fileId,
      shapeId: uShape.id,
      shape: { points: getPointsScaled(uShape.points) }
    })
    useFilesStore.getState().updateFileShapes(fileId, uShape.id, shapeType, {
      id: uShape.id,
      points: getPointsScaled(uShape.points)
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

        {polygons.map((polygon) => (
          <div
            onClick={handleSelectPoly(polygon.id)}
            key={polygon.id}
            className={cn('w-full flex gap-2 bg-gray-200 py-2 px-3 rounded-lg mb-3 border-2', {
              'border-gray-400': selectedShape?.id === polygon.id,
              'border-transparent': selectedShape?.id !== polygon.id
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

        {rectangles.map((rect) => (
          <div
            onClick={handleSelectRect(rect.id)}
            key={rect.id}
            className={cn('w-full flex gap-2 bg-gray-200 py-2 px-3 rounded-lg mb-3 border-2', {
              'border-gray-400': selectedShape?.id === rect.id,
              'border-transparent': selectedShape?.id !== rect.id
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

        {circles.map((circle) => (
          <div
            onClick={handleSelectCircle(circle.id)}
            key={circle.id}
            className={cn('w-full flex gap-2 bg-gray-200 py-2 px-3 rounded-lg mb-3 border-2', {
              'border-gray-400': selectedShape?.id === circle.id,
              'border-transparent': selectedShape?.id !== circle.id
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

        {faces.map((face) => (
          <div
            onClick={handleSelectFace(face.id)}
            key={face.id}
            className={cn(
              'w-full flex gap-2 bg-gray-200 py-2 px-3 rounded-lg mb-3 border-2 last:mb-0',
              {
                'border-gray-400': selectedShape?.id === face.id,
                'border-transparent': selectedShape?.id !== face.id
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

        {lines.map((line) => (
          <div
            onClick={handleSelectLine(line.id)}
            key={line.id}
            className={cn(
              'w-full flex gap-2 bg-gray-200 py-2 px-3 rounded-lg mb-3 border-2 last:mb-0',
              {
                'border-gray-400': selectedShape?.id === line.id,
                'border-transparent': selectedShape?.id !== line.id
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
