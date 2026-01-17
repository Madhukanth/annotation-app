import Konva from 'konva'
import { FC, RefObject, useCallback, useEffect } from 'react'
import { Layer } from 'react-konva'

import PolygonShape from './PolygonShape'
import RectangleShape from './RectangleShape'
import CircleShape from './CircleShape'
import FaceShape from './FaceShape'
import LineShape from './LineShape'
import PointType from '@models/Point.model'
import ImgSize from '@models/ImgSize.model'
import { useImageStore, useImageUntrackedStore } from '../../store/image.store'
import { useFilesStore } from '@renderer/store/files.store'
import type AnnotationType from '@renderer/models/Annotation.model'

type ShapesLayerProps = {
  stageRef: RefObject<Konva.Stage>
  imgSize: ImgSize
  selectCommentTab: () => void
}
const ShapesLayer: FC<ShapesLayerProps> = ({ stageRef, imgSize, selectCommentTab }) => {
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
    // Cast to AnnotationType since ImageAnnotate only handles image files (array-based metadata)
    const metadata = fileObj?.metadata as AnnotationType | undefined
    const savedPolygons = metadata?.polygons || []
    const savedRectangles = metadata?.rectangles || []
    const savedCircles = metadata?.circles || []
    const savedFaces = metadata?.faces || []
    const savedLines = metadata?.lines || []

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
      <PolygonShape selectCommentTab={selectCommentTab} stageRef={stageRef} imgSize={imgSize} />
      <RectangleShape selectCommentTab={selectCommentTab} imgSize={imgSize} />
      <CircleShape selectCommentTab={selectCommentTab} imgSize={imgSize} />
      <FaceShape selectCommentTab={selectCommentTab} stageRef={stageRef} imgSize={imgSize} />
      <LineShape selectCommentTab={selectCommentTab} stageRef={stageRef} imgSize={imgSize} />
    </Layer>
  )
}

export default ShapesLayer
