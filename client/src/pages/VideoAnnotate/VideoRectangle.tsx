import { FC, Fragment } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'

import KonvaRectangle from '@renderer/components/KonvaRectangle'
import RectangleType from '@models/Rectangle.model'
import { useOrgStore } from '@renderer/store/organization.store'
import { updateShape } from '@renderer/helpers/axiosRequests'
import ImgSize from '@models/ImgSize.model'
import { useUntrackedVideoStore, useVideoPlayerStore, useVideoStore } from './store/video.store'
import { useFilesStore } from '@renderer/store/files.store'

type VideoRectanglesProps = {
  imgSize: ImgSize
  selectCommentTab: () => void
  calculateCurrentFrame: () => number
}
const VideoRectangles: FC<VideoRectanglesProps> = ({
  imgSize,
  selectCommentTab,
  calculateCurrentFrame
}) => {
  const orgId = useOrgStore((s) => s.selectedOrg)
  const { projectid: projectId } = useParams()
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id
  const { mutate: updateShapeMutate } = useMutation(updateShape)

  const rectangles = useVideoStore((state) => state.rectangles)
  const updateRectangle = useVideoStore((state) => state.updateRectangle)

  const currentTimeAndFrame = useVideoPlayerStore((state) => state.currentTimeAndFrameMap)

  const selectedCircleId = useUntrackedVideoStore((state) => state.selectedCircleId)
  const setSelectedCircleId = useUntrackedVideoStore((state) => state.setSelectedCircleId)
  const selectedRectangletId = useUntrackedVideoStore((state) => state.selectedRectangleId)
  const setSelectedRectangleId = useUntrackedVideoStore((state) => state.setSelectedRectangleId)
  const isDrawingPolygon = useUntrackedVideoStore((state) => state.isDrawingPolygon)
  const setSelectedPolyId = useUntrackedVideoStore((state) => state.setSelectedPolyId)
  const selectedPolyId = useUntrackedVideoStore((state) => state.selectedPolyId)
  const selectedFaceId = useUntrackedVideoStore((state) => state.selectedFaceId)
  const setSelectedFaceId = useUntrackedVideoStore((state) => state.setSelectedFaceId)

  const handleRectDragOrChange = (updatedRect: RectangleType) => {
    updateRectangle(calculateCurrentFrame(), updatedRect.id, { ...updatedRect })

    if (!orgId || !projectId || !fileId) return

    const scaleX = imgSize.offsetWidth / imgSize.naturalWidth
    const scaleY = imgSize.offsetHeight / imgSize.naturalHeight

    updateShapeMutate({
      orgId,
      projectId,
      fileId,
      shapeId: updatedRect.id,
      shape: {
        ...updatedRect,
        x: updatedRect.x / scaleX,
        y: updatedRect.y / scaleY,
        height: updatedRect.height / scaleY,
        width: updatedRect.width / scaleX
      }
    })
  }

  const onRectClick = (rectId: string) => {
    if (isDrawingPolygon) return

    setSelectedRectangleId(rectId)

    if (selectedPolyId) {
      setSelectedPolyId(null)
    }

    if (selectedCircleId) {
      setSelectedCircleId(null)
    }

    if (selectedFaceId) {
      setSelectedFaceId(null)
    }
  }

  const frameWiseRectangles = rectangles[currentTimeAndFrame.frame] || []

  return (
    <Fragment>
      {frameWiseRectangles.map((rect) => (
        <KonvaRectangle
          key={rect.id}
          selectCommentTab={selectCommentTab}
          selectRectangle={onRectClick}
          isSelected={selectedRectangletId === rect.id}
          stroke={rect.stroke}
          shapeProps={{ ...rect }}
          updateRectangle={handleRectDragOrChange}
        />
      ))}
    </Fragment>
  )
}

export default VideoRectangles
