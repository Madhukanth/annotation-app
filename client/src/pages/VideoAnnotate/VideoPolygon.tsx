import { FC, Fragment, RefObject } from 'react'
import Konva from 'konva'
import { useMutation } from '@tanstack/react-query'

import Polygon from '@/components/shapes/konva/KonvaPolygon'
import PolygonType from '@models/Polygon.model'
import { shapesService } from '@/services/supabase'
import PointType from '@models/Point.model'
import ImgSize from '@models/ImgSize.model'
import { useUntrackedVideoStore, useVideoPlayerStore, useVideoStore } from './store/video.store'
import { useFilesStore } from '@renderer/store/files.store'

type VideoPolygonProps = {
  stageRef: RefObject<Konva.Stage>
  imgSize: ImgSize
  calculateCurrentFrame: () => number
  selectCommentTab: () => void
}
const VideoPolygon: FC<VideoPolygonProps> = ({
  stageRef,
  imgSize,
  selectCommentTab,
  calculateCurrentFrame
}) => {
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id

  const updateShapeMutation = useMutation({
    mutationFn: ({ shapeId, data }: { shapeId: string; data: Parameters<typeof shapesService.updateShape>[1] }) =>
      shapesService.updateShape(shapeId, data)
  })

  const currentTimeAndFrame = useVideoPlayerStore((state) => state.currentTimeAndFrameMap)

  const polygons = useVideoStore((state) => state.polygons)
  const updatePolygon = useVideoStore((state) => state.updatePolygon)

  const selectedCircleId = useUntrackedVideoStore((state) => state.selectedCircleId)
  const setSelectedCircleId = useUntrackedVideoStore((state) => state.setSelectedCircleId)
  const selectedRectId = useUntrackedVideoStore((state) => state.selectedRectangleId)
  const setSelectedRectangleId = useUntrackedVideoStore((state) => state.setSelectedRectangleId)
  const isDrawingPolygon = useUntrackedVideoStore((state) => state.isDrawingPolygon)
  const setSelectedPolyPoint = useUntrackedVideoStore((state) => state.setSelectedPolyPoint)
  const setSelectedPolyId = useUntrackedVideoStore((state) => state.setSelectedPolyId)
  const selectedPolyId = useUntrackedVideoStore((state) => state.selectedPolyId)
  const selectedPolyPoint = useUntrackedVideoStore((state) => state.selectedPolyPoint)
  const selectedFaceId = useUntrackedVideoStore((state) => state.selectedFaceId)
  const setSelectedFaceId = useUntrackedVideoStore((state) => state.setSelectedFaceId)
  const setSelectedLineId = useUntrackedVideoStore((state) => state.setSelectedLineId)
  const setSelectedLinePoint = useUntrackedVideoStore((state) => state.setSelectedLinePoint)
  const selectedLineId = useUntrackedVideoStore((state) => state.selectedLineId)
  const selectedLinePoint = useUntrackedVideoStore((state) => state.selectedLinePoint)

  const getPointsScaled = (pts: PointType[]) => {
    const scaleX = imgSize.offsetWidth / imgSize.naturalWidth
    const scaleY = imgSize.offsetHeight / imgSize.naturalHeight
    return pts.map((p) => ({ ...p, x: p.x / scaleX, y: p.y / scaleY }))
  }

  const handlePolyDragOrChange = (updatedPoly: PolygonType) => {
    updatePolygon(calculateCurrentFrame(), updatedPoly.id, { ...updatedPoly })

    if (!fileId) return
    updateShapeMutation.mutate({
      shapeId: updatedPoly.id,
      data: { points: getPointsScaled(updatedPoly.points) }
    })
  }

  const onPolyClick = (polyId: string) => () => {
    if (isDrawingPolygon) return

    setSelectedPolyId(polyId)

    if (selectedRectId) {
      setSelectedRectangleId(null)
    }

    if (selectedCircleId) {
      setSelectedCircleId(null)
    }

    if (selectedFaceId) {
      setSelectedFaceId(null)
    }

    if (selectedLineId) {
      setSelectedLineId(null)
    }
  }

  const handlePointSelect = (val: { polyId: string; pointId: string }) => {
    if (selectedLinePoint) {
      setSelectedLinePoint(null)
    }

    setSelectedPolyPoint(val)
  }

  const frameWisePolygons = polygons[currentTimeAndFrame.frame] || []

  return (
    <Fragment>
      {frameWisePolygons.map((polygon) => (
        <Polygon
          selectCommentTab={selectCommentTab}
          stageRef={stageRef}
          key={polygon.id}
          isDrawing={isDrawingPolygon}
          isSelected={selectedPolyId === polygon.id}
          stroke={polygon.stroke}
          strokeWidth={polygon.strokeWidth}
          shapeProps={{ ...polygon, points: polygon.points.slice() }}
          onChange={handlePolyDragOrChange}
          onSelect={onPolyClick(polygon.id)}
          onPointClick={handlePointSelect}
          selectedPointId={selectedPolyPoint?.pointId || null}
        />
      ))}
    </Fragment>
  )
}

export default VideoPolygon
