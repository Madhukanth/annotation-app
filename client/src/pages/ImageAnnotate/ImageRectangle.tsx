import { FC, Fragment } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'

import KonvaRectangle from '@renderer/components/KonvaRectangle'
import RectangleType from '@models/Rectangle.model'
import { useOrgStore } from '@renderer/store/organization.store'
import { updateShape } from '@renderer/helpers/axiosRequests'
import ImgSize from '@models/ImgSize.model'
import { useFilesStore } from '@renderer/store/files.store'
import { ShapeType } from '@models/Shape.model'
import { useImageStore, useImageUntrackedStore } from './store/image.store'
import SimpleRectangle from '@renderer/components/SimpleRectangle'

type ImageRectanglesProps = { imgSize: ImgSize; selectCommentTab: () => void }
const ImageRectangles: FC<ImageRectanglesProps> = ({ imgSize, selectCommentTab }) => {
  const orgId = useOrgStore((s) => s.selectedOrg)
  const { projectid: projectId } = useParams()
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id
  const { mutate: updateShapeMutate } = useMutation(updateShape)

  const drawingShape = useImageUntrackedStore((state) => state.drawingShape)
  const selectedShape = useImageUntrackedStore((state) => state.selectedShape)
  const setSelectedShape = useImageUntrackedStore((state) => state.setSelectedShape)
  const aIPoints = useImageUntrackedStore((s) => s.aIPoints)

  const rectangles = useImageStore((state) => state.rectangles)
  const updateRectangle = useImageStore((state) => state.updateRectangle)

  const handleRectDragOrChange = (updatedRect: RectangleType) => {
    updateRectangle(updatedRect.id, { ...updatedRect })

    if (!orgId || !projectId || !fileId) return

    const scaleX = imgSize.offsetWidth / imgSize.naturalWidth
    const scaleY = imgSize.offsetHeight / imgSize.naturalHeight

    const uRect = {
      ...updatedRect,
      x: updatedRect.x / scaleX,
      y: updatedRect.y / scaleY,
      height: updatedRect.height / scaleY,
      width: updatedRect.width / scaleX
    }
    updateShapeMutate({
      orgId,
      projectId,
      fileId,
      shapeId: updatedRect.id,
      shape: uRect
    })
    useFilesStore
      .getState()
      .updateFileShapes(fileId, updatedRect.id, 'rectangle', uRect as ShapeType)
  }

  const onRectClick = (rectId: string) => {
    if (drawingShape?.type === 'rectangle') return

    setSelectedShape({ type: 'rectangle', id: rectId })
  }

  return (
    <Fragment>
      {aIPoints?.x2 && aIPoints?.y2 && (
        <SimpleRectangle
          shapeProps={{
            id: 'new-rect',
            notes: '',
            orgId: 'null',
            projectId: 'null',
            fileId: 'null',
            strokeWidth: 2,
            name: 'AI Box',
            stroke: 'rgb(238, 130, 238)',
            x: aIPoints.x1,
            y: aIPoints.y1,
            width: aIPoints.x2 - aIPoints.x1,
            height: aIPoints.y2 - aIPoints.y1
          }}
          stroke="rgb(238, 130, 238)"
        />
      )}

      {rectangles.map((rect) => (
        <KonvaRectangle
          key={rect.id}
          selectCommentTab={selectCommentTab}
          selectRectangle={onRectClick}
          isSelected={selectedShape?.id === rect.id}
          stroke={rect.stroke}
          shapeProps={{ ...rect }}
          updateRectangle={handleRectDragOrChange}
        />
      ))}
    </Fragment>
  )
}

export default ImageRectangles
