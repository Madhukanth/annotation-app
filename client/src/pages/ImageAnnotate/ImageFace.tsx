import { FC, Fragment, RefObject } from 'react'
import Konva from 'konva'
import { useParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'

import FaceType from '@models/Face.model'
import PointType from '@models/Point.model'
import KonvaFace from '@renderer/components/KonvaFace'
import { useOrgStore } from '@renderer/store/organization.store'
import { shapesService, UpdateShapeInput } from '@/services/supabase'
import ImgSize from '@models/ImgSize.model'
import { useFilesStore } from '@renderer/store/files.store'
import { useImageStore, useImageUntrackedStore } from './store/image.store'

type ImageFaceProps = {
  stageRef: RefObject<Konva.Stage>
  imgSize: ImgSize
  selectCommentTab: () => void
}
const ImageFace: FC<ImageFaceProps> = ({ stageRef, imgSize, selectCommentTab }) => {
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
  const faces = useImageStore((state) => state.faces)
  const updateFace = useImageStore((state) => state.updateFace)

  const getPointsScaled = (pts: PointType[]) => {
    const scaleX = imgSize.offsetWidth / imgSize.naturalWidth
    const scaleY = imgSize.offsetHeight / imgSize.naturalHeight
    return pts.map((p) => ({ ...p, x: p.x / scaleX, y: p.y / scaleY }))
  }

  const handleFaceDragOrChange = (updatedFace: FaceType) => {
    updateFace(updatedFace.id, { ...updatedFace })

    if (!orgId || !projectId || !fileId) return
    const uFace: UpdateShapeInput = { points: getPointsScaled(updatedFace.points) }
    updateShapeMutate({
      shapeId: updatedFace.id,
      shape: uFace
    })
    useFilesStore.getState().updateFileShapes(fileId, updatedFace.id, 'face', uFace)
  }

  const onFaceClick = (faceId: string) => () => {
    if (drawingShape) return

    setSelectedShape({ type: 'face', id: faceId })
  }

  return (
    <Fragment>
      {faces.map((face) => (
        <KonvaFace
          selectCommentTab={selectCommentTab}
          stageRef={stageRef}
          key={face.id}
          shapeProps={{ ...face }}
          isSelected={selectedShape?.id === face.id}
          stroke={face.stroke}
          strokeWidth={face.strokeWidth}
          onChange={handleFaceDragOrChange}
          onSelect={onFaceClick(face.id)}
        />
      ))}
    </Fragment>
  )
}

export default ImageFace
