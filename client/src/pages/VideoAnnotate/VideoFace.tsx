import { FC, Fragment, RefObject } from 'react'
import Konva from 'konva'
import { useMutation } from '@tanstack/react-query'

import FaceType from '@models/Face.model'
import PointType from '@models/Point.model'
import KonvaFace from '@renderer/components/KonvaFace'
import { shapesService } from '@/services/supabase'
import ImgSize from '@models/ImgSize.model'
import { useUntrackedVideoStore, useVideoPlayerStore, useVideoStore } from './store/video.store'
import { useFilesStore } from '@renderer/store/files.store'

type VideoFaceProps = {
  stageRef: RefObject<Konva.Stage>
  imgSize: ImgSize
  calculateCurrentFrame: () => number
  selectCommentTab: () => void
}
const VideoFace: FC<VideoFaceProps> = ({
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

  const faces = useVideoStore((state) => state.faces)
  const updateFace = useVideoStore((state) => state.updateFace)

  const selectedCircleId = useUntrackedVideoStore((state) => state.selectedCircleId)
  const setSelectedCircleId = useUntrackedVideoStore((state) => state.setSelectedCircleId)
  const selectedRectangleId = useUntrackedVideoStore((state) => state.selectedRectangleId)
  const setSelectedRectangleId = useUntrackedVideoStore((state) => state.setSelectedRectangleId)
  const isDrawingPolygon = useUntrackedVideoStore((state) => state.isDrawingPolygon)
  const setSelectedPolyId = useUntrackedVideoStore((state) => state.setSelectedPolyId)
  const selectedPolyId = useUntrackedVideoStore((state) => state.selectedPolyId)
  const selectedFaceId = useUntrackedVideoStore((state) => state.selectedFaceId)
  const setSelectedFaceId = useUntrackedVideoStore((state) => state.setSelectedFaceId)
  const selectedLineId = useUntrackedVideoStore((state) => state.selectedLineId)
  const setSelectedLineId = useUntrackedVideoStore((state) => state.setSelectedLineId)

  const currentTimeAndFrame = useVideoPlayerStore((state) => state.currentTimeAndFrameMap)

  const getPointsScaled = (pts: PointType[]) => {
    const scaleX = imgSize.offsetWidth / imgSize.naturalWidth
    const scaleY = imgSize.offsetHeight / imgSize.naturalHeight
    return pts.map((p) => ({ ...p, x: p.x / scaleX, y: p.y / scaleY }))
  }

  const handleFaceDragOrChange = (updatedFace: FaceType) => {
    updateFace(calculateCurrentFrame(), updatedFace.id, { ...updatedFace })

    if (!fileId) return
    updateShapeMutation.mutate({
      shapeId: updatedFace.id,
      data: { points: getPointsScaled(updatedFace.points) }
    })
  }

  const onFaceClick = (faceId: string) => () => {
    if (isDrawingPolygon) return

    setSelectedFaceId(faceId)

    if (selectedPolyId) {
      setSelectedPolyId(null)
    }

    if (selectedRectangleId) {
      setSelectedRectangleId(null)
    }

    if (selectedCircleId) {
      setSelectedCircleId(null)
    }

    if (selectedLineId) {
      setSelectedLineId(null)
    }
  }

  const frameWiseFaces = faces[currentTimeAndFrame.frame] || []

  return (
    <Fragment>
      {frameWiseFaces.map((face) => (
        <KonvaFace
          selectCommentTab={selectCommentTab}
          stageRef={stageRef}
          key={face.id}
          shapeProps={{ ...face }}
          isSelected={selectedFaceId === face.id}
          stroke={face.stroke}
          strokeWidth={face.strokeWidth}
          onChange={handleFaceDragOrChange}
          onSelect={onFaceClick(face.id)}
        />
      ))}
    </Fragment>
  )
}

export default VideoFace
