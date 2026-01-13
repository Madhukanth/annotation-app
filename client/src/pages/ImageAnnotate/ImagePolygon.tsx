import { FC, Fragment, RefObject } from 'react'
import Konva from 'konva'
import { useMutation } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import Polygon from '@renderer/components/KonvaPolygon'
import PolygonType from '@models/Polygon.model'
import { useOrgStore } from '@renderer/store/organization.store'
import { shapesService, UpdateShapeInput } from '@/services/supabase'
import PointType from '@models/Point.model'
import ImgSize from '@models/ImgSize.model'
import { useFilesStore } from '@renderer/store/files.store'
import { ShapeType } from '@models/Shape.model'
import { useImageStore, useImageUntrackedStore } from './store/image.store'

type PolygonProps = {
  stageRef: RefObject<Konva.Stage>
  imgSize: ImgSize
  selectCommentTab: () => void
}
const ImagePolygon: FC<PolygonProps> = ({ stageRef, imgSize, selectCommentTab }) => {
  const orgId = useOrgStore((s) => s.selectedOrg)

  const { projectid: projectId } = useParams()
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id
  const { mutate: updateShapeMutate } = useMutation({
    mutationFn: ({ shapeId, shape }: { shapeId: string; shape: UpdateShapeInput }) =>
      shapesService.updateShape(shapeId, shape)
  })

  const polygons = useImageStore((state) => state.polygons)
  const updatePolygon = useImageStore((state) => state.updatePolygon)

  const drawingShape = useImageUntrackedStore((state) => state.drawingShape)
  const selectedShape = useImageUntrackedStore((state) => state.selectedShape)
  const setSelectedShape = useImageUntrackedStore((state) => state.setSelectedShape)
  const setSelectedPoint = useImageUntrackedStore((state) => state.setSelectedPolyPoint)
  const selectedPoint = useImageUntrackedStore((state) => state.selectedPolyPoint)
  const selectedLinePoint = useImageUntrackedStore((state) => state.selectedLinePoint)
  const setSelectedLinePoint = useImageUntrackedStore((state) => state.setSelectedLinePoint)

  const getPointsScaled = (pts: PointType[]) => {
    const scaleX = imgSize.offsetWidth / imgSize.naturalWidth
    const scaleY = imgSize.offsetHeight / imgSize.naturalHeight
    return pts.map((p) => ({ ...p, x: p.x / scaleX, y: p.y / scaleY }))
  }

  const handlePolyDragOrChange = (updatedPoly: PolygonType) => {
    updatePolygon(updatedPoly.id, { ...updatedPoly })

    if (!orgId || !projectId || !fileId) return
    const uPoly: UpdateShapeInput = { points: getPointsScaled(updatedPoly.points) }
    updateShapeMutate({
      shapeId: updatedPoly.id,
      shape: uPoly
    })
    useFilesStore.getState().updateFileShapes(fileId, updatedPoly.id, 'polygon', uPoly as ShapeType)
  }

  const onPolyClick = (polyId: string) => () => {
    if (drawingShape?.type === 'polygon') return
    setSelectedShape({ type: 'polygon', id: polyId })
  }

  const handlePointSelect = (val: { polyId: string; pointId: string }) => {
    if (selectedLinePoint) {
      setSelectedLinePoint(null)
    }

    setSelectedPoint(val)
  }

  return (
    <Fragment>
      {polygons.map((polygon) => (
        <Polygon
          selectCommentTab={selectCommentTab}
          stageRef={stageRef}
          key={polygon.id}
          isDrawing={drawingShape ? drawingShape.id : null}
          isSelected={selectedShape?.id === polygon.id}
          stroke={polygon.stroke}
          strokeWidth={polygon.strokeWidth}
          shapeProps={{ ...polygon, points: polygon.points.slice() }}
          onChange={handlePolyDragOrChange}
          onSelect={onPolyClick(polygon.id)}
          onPointClick={handlePointSelect}
          selectedPointId={selectedPoint?.pointId || null}
        />
      ))}
    </Fragment>
  )
}

export default ImagePolygon
