import { FC, Fragment } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'

import KonvaCircle from '@renderer/components/KonvaCircle'
import CircleType from '@models/Circle.model'
import { useOrgStore } from '@renderer/store/organization.store'
import { shapesService, UpdateShapeInput } from '@/services/supabase'
import ImgSize from '@models/ImgSize.model'
import { useFilesStore } from '@renderer/store/files.store'
import { ShapeType } from '@models/Shape.model'
import { useImageStore, useImageUntrackedStore } from './store/image.store'

type ImageCircleProps = { imgSize: ImgSize; selectCommentTab: () => void }
const ImageCircle: FC<ImageCircleProps> = ({ imgSize, selectCommentTab }) => {
  const orgId = useOrgStore((s) => s.selectedOrg)
  const { projectid: projectId } = useParams()
  const { mutate: updateShapeMutate } = useMutation({
    mutationFn: ({ shapeId, shape }: { shapeId: string; shape: UpdateShapeInput }) =>
      shapesService.updateShape(shapeId, shape)
  })
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id

  // importing all zustand circle
  const drawingShape = useImageUntrackedStore((state) => state.drawingShape)
  const selectedShape = useImageUntrackedStore((state) => state.selectedShape)
  const setSelectedShape = useImageUntrackedStore((state) => state.setSelectedShape)
  const circles = useImageStore((state) => state.circles)
  const updateCircle = useImageStore((state) => state.updateCircle)

  const handleCircleDragOrChange = (updatedCircle: CircleType) => {
    updateCircle(updatedCircle.id, { ...updatedCircle })

    if (!orgId || !projectId || !fileId || !fileObj) return

    const scaleX = imgSize.offsetWidth / imgSize.naturalWidth
    const scaleY = imgSize.offsetHeight / imgSize.naturalHeight

    const uShape: UpdateShapeInput = {
      x: updatedCircle.x / scaleX,
      y: updatedCircle.y / scaleY,
      height: updatedCircle.height / scaleY,
      width: updatedCircle.width / scaleX
    }
    updateShapeMutate({
      shapeId: updatedCircle.id,
      shape: uShape
    })
    useFilesStore
      .getState()
      .updateFileShapes(fileId, updatedCircle.id, 'circle', uShape as ShapeType)
  }

  const onCircleClick = (circleId: string) => {
    if (drawingShape) return

    setSelectedShape({ type: 'circle', id: circleId })
  }

  return (
    <Fragment>
      {circles.map((circle) => (
        <KonvaCircle
          key={circle.id}
          selectCommentTab={selectCommentTab}
          isSelected={selectedShape?.id === circle.id}
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
