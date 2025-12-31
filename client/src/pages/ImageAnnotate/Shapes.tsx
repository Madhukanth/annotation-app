import Konva from 'konva'
import { FC, RefObject, useCallback, useEffect } from 'react'
import { Layer } from 'react-konva'

import ImagePolygon from './ImagePolygon'
import ImageRectangles from './ImageRectangle'
import ImageCircle from './ImageCircle'
import ImageFace from './ImageFace'
import ImageLines from './ImageLine'
import PointType from '@models/Point.model'
import ImgSize from '@models/ImgSize.model'
import { useImageStore, useImageUntrackedStore } from './store/image.store'
import { useFilesStore } from '@renderer/store/files.store'

type ShapesProps = {
  stageRef: RefObject<Konva.Stage>
  imgSize: ImgSize
  selectCommentTab: () => void
}
const Shapes: FC<ShapesProps> = ({ stageRef, imgSize, selectCommentTab }) => {
  const fileObj = useFilesStore((s) => s.selectedFile)
  const fileId = fileObj?.id

  const setSelectedShape = useImageUntrackedStore((state) => state.setSelectedShape)
  const setSelectedLinePoint = useImageUntrackedStore((state) => state.setSelectedLinePoint)
  const setSelectedPolyPoint = useImageUntrackedStore((state) => state.setSelectedPolyPoint)

  const setPolygons = useImageStore((state) => state.setPolygons)
  const setRectangles = useImageStore((state) => state.setRectangles)
  const setCircles = useImageStore((state) => state.setCircles)
  const setFaces = useImageStore((state) => state.setFaces)
  const setLines = useImageStore((state) => state.setLines)

  const restorePoints = useCallback((pts: PointType[], scaleX: number, scaleY: number) => {
    return pts.map((p) => ({ ...p, x: p.x * scaleX, y: p.y * scaleY }))
  }, [])

  useEffect(() => {
    return () => {
      setPolygons([])
      setCircles([])
      setRectangles([])
      setFaces([])
      setLines([])
      setSelectedShape(null)
      setSelectedLinePoint(null)
      setSelectedPolyPoint(null)
    }
  }, [
    setPolygons,
    setCircles,
    setRectangles,
    setFaces,
    setLines,
    setSelectedShape,
    setSelectedLinePoint,
    setSelectedPolyPoint
  ])

  useEffect(() => {
    if (!fileId) return

    const scaleX = imgSize.offsetWidth / imgSize.naturalWidth
    const scaleY = imgSize.offsetHeight / imgSize.naturalHeight
    const savedPolygons = fileObj?.metadata?.polygons || []
    const savedRectangles = fileObj?.metadata?.rectangles || []
    const savedCircles = fileObj?.metadata?.circles || []
    const savedFaces = fileObj?.metadata?.faces || []
    const savedLines = fileObj?.metadata?.lines || []

    const scaledPolygons = savedPolygons.map((p) => ({
      ...p,
      points: restorePoints(p.points, scaleX, scaleY)
    }))
    const scaledLines = savedLines.map((l) => ({
      ...l,
      points: restorePoints(l.points, scaleX, scaleY)
    }))
    const scaledRectangles = savedRectangles.map((r) => ({
      ...r,
      height: r.height * scaleY,
      width: r.width * scaleX,
      x: r.x * scaleX,
      y: r.y * scaleY
    }))
    const scaledCircles = savedCircles.map((c) => ({
      ...c,
      height: c.height * scaleY,
      width: c.width * scaleX,
      x: c.x * scaleX,
      y: c.y * scaleY
    }))
    const scaledFaces = savedFaces.map((f) => ({
      ...f,
      points: restorePoints(f.points, scaleX, scaleY)
    }))

    setPolygons(scaledPolygons)
    setRectangles(scaledRectangles)
    setCircles(scaledCircles)
    setFaces(scaledFaces)
    setLines(scaledLines)
    setSelectedPolyPoint(null)
    setSelectedLinePoint(null)
    setSelectedShape(null)
  }, [fileId, imgSize])

  return (
    <Layer>
      <ImagePolygon selectCommentTab={selectCommentTab} stageRef={stageRef} imgSize={imgSize} />
      <ImageRectangles selectCommentTab={selectCommentTab} imgSize={imgSize} />
      <ImageCircle selectCommentTab={selectCommentTab} imgSize={imgSize} />
      <ImageFace selectCommentTab={selectCommentTab} stageRef={stageRef} imgSize={imgSize} />
      <ImageLines selectCommentTab={selectCommentTab} stageRef={stageRef} imgSize={imgSize} />
    </Layer>
  )
}

export default Shapes
