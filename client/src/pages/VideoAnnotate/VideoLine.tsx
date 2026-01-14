import { FC, Fragment, RefObject } from 'react'
import Konva from 'konva'
import { useMutation } from '@tanstack/react-query'

import KonvaLine from '@/components/shapes/konva/KonvaLine'
import LineType from '@models/Line.model'
import { shapesService } from '@/services/supabase'
import PointType from '@models/Point.model'
import ImgSize from '@models/ImgSize.model'
import { useUntrackedVideoStore, useVideoPlayerStore, useVideoStore } from './store/video.store'
import { useFilesStore } from '@renderer/store/files.store'

type VideoLinesProps = {
  stageRef: RefObject<Konva.Stage>
  imgSize: ImgSize
  calculateCurrentFrame: () => number
  selectCommentTab: () => void
}
const VideoLines: FC<VideoLinesProps> = ({
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

  const lines = useVideoStore((state) => state.lines)
  const updateLine = useVideoStore((state) => state.updateLine)

  const selectedCircleId = useUntrackedVideoStore((state) => state.selectedCircleId)
  const setSelectedCircleId = useUntrackedVideoStore((state) => state.setSelectedCircleId)
  const selectedRectId = useUntrackedVideoStore((state) => state.selectedRectangleId)
  const setSelectedRectangleId = useUntrackedVideoStore((state) => state.setSelectedRectangleId)
  const selectedPolyId = useUntrackedVideoStore((state) => state.selectedPolyId)
  const setSelectedPolyId = useUntrackedVideoStore((state) => state.setSelectedPolyId)
  const selectedPolyPoint = useUntrackedVideoStore((state) => state.selectedPolyPoint)
  const setSelectedPolyPoint = useUntrackedVideoStore((state) => state.setSelectedPolyPoint)
  const isDrawingLine = useUntrackedVideoStore((state) => state.isDrawingLine)
  const setSelectedLineId = useUntrackedVideoStore((state) => state.setSelectedLineId)
  const selectedLinePoint = useUntrackedVideoStore((state) => state.selectedLinePoint)
  const setSelectedLinePoint = useUntrackedVideoStore((state) => state.setSelectedLinePoint)
  const selectedLineId = useUntrackedVideoStore((state) => state.selectedLineId)
  const selectedFaceId = useUntrackedVideoStore((state) => state.selectedFaceId)
  const setSelectedFaceId = useUntrackedVideoStore((state) => state.setSelectedFaceId)

  const getPointsScaled = (pts: PointType[]) => {
    const scaleX = imgSize.offsetWidth / imgSize.naturalWidth
    const scaleY = imgSize.offsetHeight / imgSize.naturalHeight
    return pts.map((p) => ({ ...p, x: p.x / scaleX, y: p.y / scaleY }))
  }

  const handleLineDragOrChange = (updatedLine: LineType) => {
    updateLine(calculateCurrentFrame(), updatedLine.id, { ...updatedLine })

    if (!fileId) return
    updateShapeMutation.mutate({
      shapeId: updatedLine.id,
      data: { points: getPointsScaled(updatedLine.points) }
    })
  }

  const onLineClick = (lineId: string) => () => {
    if (isDrawingLine) return

    setSelectedLineId(lineId)

    if (selectedPolyId) {
      setSelectedPolyId(null)
    }

    if (selectedRectId) {
      setSelectedRectangleId(null)
    }

    if (selectedCircleId) {
      setSelectedCircleId(null)
    }

    if (selectedFaceId) {
      setSelectedFaceId(null)
    }
  }

  const handlePointSelect = (val: { lineId: string; pointId: string }) => {
    if (selectedPolyPoint) {
      setSelectedPolyPoint(null)
    }

    setSelectedLinePoint(val)
  }

  const frameWiseLines = lines[currentTimeAndFrame.frame] || []

  return (
    <Fragment>
      {frameWiseLines.map((line) => (
        <KonvaLine
          stageRef={stageRef}
          key={line.id}
          isDrawing={isDrawingLine}
          isSelected={selectedLineId === line.id}
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

export default VideoLines
