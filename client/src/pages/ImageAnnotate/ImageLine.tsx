import { FC, Fragment, RefObject } from 'react'
import Konva from 'konva'
import { useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'

import KonvaLine from '@renderer/components/KonvaLine'
import LineType from '@models/Line.model'
import { useOrgStore } from '@renderer/store/organization.store'
import { shapesService, UpdateShapeInput } from '@/services/supabase'
import PointType from '@models/Point.model'
import ImgSize from '@models/ImgSize.model'
import { useFilesStore } from '@renderer/store/files.store'
import { ShapeType } from '@models/Shape.model'
import { useImageStore, useImageUntrackedStore } from './store/image.store'

type ImageLinesProps = {
  stageRef: RefObject<Konva.Stage>
  imgSize: ImgSize
  selectCommentTab: () => void
}
const ImageLines: FC<ImageLinesProps> = ({ stageRef, imgSize, selectCommentTab }) => {
  const orgId = useOrgStore((s) => s.selectedOrg)
  const { projectid: projectId } = useParams()
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id
  const { mutate: updateShapeMutate } = useMutation({
    mutationFn: ({ shapeId, shape }: { shapeId: string; shape: UpdateShapeInput }) =>
      shapesService.updateShape(shapeId, shape)
  })

  const drawingShape = useImageUntrackedStore((state) => state.drawingShape)
  const selectedShape = useImageUntrackedStore((state) => state.selectedShape)
  const setSelectedShape = useImageUntrackedStore((state) => state.setSelectedShape)
  const selectedPolyPoint = useImageUntrackedStore((state) => state.selectedPolyPoint)
  const setSelectedPolyPoint = useImageUntrackedStore((state) => state.setSelectedPolyPoint)
  const lines = useImageStore((state) => state.lines)
  const updateLine = useImageStore((state) => state.updateLine)
  const setSelectedLinePoint = useImageUntrackedStore((state) => state.setSelectedLinePoint)
  const selectedLinePoint = useImageUntrackedStore((state) => state.selectedLinePoint)

  const getPointsScaled = (pts: PointType[]) => {
    const scaleX = imgSize.offsetWidth / imgSize.naturalWidth
    const scaleY = imgSize.offsetHeight / imgSize.naturalHeight
    return pts.map((p) => ({ ...p, x: p.x / scaleX, y: p.y / scaleY }))
  }

  const handleLineDragOrChange = (updatedLine: LineType) => {
    updateLine(updatedLine.id, { ...updatedLine })

    if (!orgId || !projectId || !fileId) return
    const uLine: UpdateShapeInput = { points: getPointsScaled(updatedLine.points) }
    updateShapeMutate({
      shapeId: updatedLine.id,
      shape: uLine
    })
    useFilesStore.getState().updateFileShapes(fileId, updatedLine.id, 'line', uLine as ShapeType)
  }

  const onLineClick = (lineId: string) => () => {
    if (drawingShape) return
    setSelectedShape({ type: 'line', id: lineId })
  }

  const handlePointSelect = (val: { lineId: string; pointId: string }) => {
    if (selectedPolyPoint) {
      setSelectedPolyPoint(null)
    }

    setSelectedLinePoint(val)
  }

  return (
    <Fragment>
      {lines.map((line) => (
        <KonvaLine
          stageRef={stageRef}
          key={line.id}
          isDrawing={drawingShape ? drawingShape.id : null}
          isSelected={selectedShape?.id === line.id}
          stroke={line.stroke}
          strokeWidth={line.strokeWidth}
          shapeProps={{ ...line, points: line.points.slice() }}
          onChange={handleLineDragOrChange}
          onSelect={onLineClick(line.id)}
          onPointClick={handlePointSelect}
          selectedPointId={selectedLinePoint?.pointId || null}
          selectCommentTab={selectCommentTab}
        />
      ))}
    </Fragment>
  )
}

export default ImageLines
