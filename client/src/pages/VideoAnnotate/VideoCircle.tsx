import { FC, Fragment } from 'react'
import { useMutation } from '@tanstack/react-query'

import KonvaCircle from '@renderer/components/KonvaCircle'
import CircleType from '@models/Circle.model'
import { shapesService } from '@/services/supabase'
import ImgSize from '@models/ImgSize.model'
import { useUntrackedVideoStore, useVideoPlayerStore, useVideoStore } from './store/video.store'
import { useFilesStore } from '@renderer/store/files.store'

type ImageCircleProps = {
  imgSize: ImgSize
  selectCommentTab: () => void
  calculateCurrentFrame: () => number
}
const ImageCircle: FC<ImageCircleProps> = ({
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

  const circles = useVideoStore((state) => state.circles)
  const updateCircle = useVideoStore((state) => state.updateCircle)

  const selectedCircleId = useUntrackedVideoStore((state) => state.selectedCircleId)
  const setSelectedCircleId = useUntrackedVideoStore((state) => state.setSelectedCircleId)
  const selectedRectangletId = useUntrackedVideoStore((state) => state.selectedRectangleId)
  const setSelectedRectangleId = useUntrackedVideoStore((state) => state.setSelectedRectangleId)
  const isDrawingPolygon = useUntrackedVideoStore((state) => state.isDrawingPolygon)
  const setSelectedPolyId = useUntrackedVideoStore((state) => state.setSelectedPolyId)
  const selectedPolyId = useUntrackedVideoStore((state) => state.selectedPolyId)
  const selectedFaceId = useUntrackedVideoStore((state) => state.selectedFaceId)
  const setSelectedFaceId = useUntrackedVideoStore((state) => state.setSelectedFaceId)
  const setSelectedLineId = useUntrackedVideoStore((state) => state.setSelectedLineId)
  const selectedLineId = useUntrackedVideoStore((state) => state.selectedLineId)

  const currentTimeAndFrame = useVideoPlayerStore((state) => state.currentTimeAndFrameMap)

  const handleCircleDragOrChange = (updatedCircle: CircleType) => {
    const circleData = {
      x: updatedCircle.x,
      y: updatedCircle.y,
      width: updatedCircle.width,
      height: updatedCircle.height
    }
    updateCircle(calculateCurrentFrame(), updatedCircle.id, { ...updatedCircle, ...circleData })

    if (!fileId) return

    const scaleX = imgSize.offsetWidth / imgSize.naturalWidth
    const scaleY = imgSize.offsetHeight / imgSize.naturalHeight

    updateShapeMutation.mutate({
      shapeId: updatedCircle.id,
      data: {
        x: circleData.x / scaleX,
        y: circleData.y / scaleY,
        height: circleData.height / scaleY,
        width: circleData.width / scaleX
      }
    })
  }

  const onCircleClick = (circleId: string) => {
    if (isDrawingPolygon) return

    setSelectedCircleId(circleId)

    if (selectedPolyId) {
      setSelectedPolyId(null)
    }

    if (selectedRectangletId) {
      setSelectedRectangleId(null)
    }

    if (selectedFaceId) {
      setSelectedFaceId(null)
    }

    if (selectedLineId) {
      setSelectedLineId(null)
    }
  }

  const frameWiseCircles = circles[currentTimeAndFrame.frame] || []

  return (
    <Fragment>
      {frameWiseCircles.map((circle) => (
        <KonvaCircle
          key={circle.id}
          selectCommentTab={selectCommentTab}
          isSelected={selectedCircleId === circle.id}
          selectCircle={onCircleClick}
          updateCircle={handleCircleDragOrChange}
          stroke={circle.stroke}
          shapeProps={{ ...circle }}
        />
      ))}
    </Fragment>
  )
}

export default ImageCircle
