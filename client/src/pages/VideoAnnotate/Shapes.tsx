import Konva from 'konva'
import { FC, RefObject, useCallback, useEffect } from 'react'
import { Layer } from 'react-konva'
import { useParams } from 'react-router-dom'

import VideoPolygon from './VideoPolygon'
import VideoRectangle from './VideoRectangle'
import VideoCircle from './VideoCircle'
import VideoFace from './VideoFace'
import VideoLine from './VideoLine'
import PointType from '@models/Point.model'
import ImgSize from '@models/ImgSize.model'
import { VideoPolygonType } from '@models/Polygon.model'
import { VideoLineType } from '@models/Line.model'
import { VideoFaceType } from '@models/Face.model'
import { VideoRectangleType } from '@models/Rectangle.model'
import { VideoCircleType } from '@models/Circle.model'
import { useUntrackedVideoStore, useVideoStore } from './store/video.store'
import { useFilesStore } from '@renderer/store/files.store'

type ShapesProps = {
  stageRef: RefObject<Konva.Stage>
  imgSize: ImgSize
  calculateCurrentFrame: () => number
  selectCommentTab: () => void
}
const Shapes: FC<ShapesProps> = ({
  stageRef,
  imgSize,
  selectCommentTab,
  calculateCurrentFrame
}) => {
  const fileObj = useFilesStore((s) => s.selectedFile)

  const setPolygons = useVideoStore((s) => s.setPolygons)
  const setRectangles = useVideoStore((s) => s.setRectangles)
  const setCircles = useVideoStore((s) => s.setCircles)
  const setFaces = useVideoStore((s) => s.setFaces)
  const setLines = useVideoStore((s) => s.setLines)

  const setSelectedPolyPoint = useUntrackedVideoStore((s) => s.setSelectedPolyPoint)
  const setIsDrawingPolygon = useUntrackedVideoStore((s) => s.setIsDrawingPolygon)
  const setSelectedRectangleId = useUntrackedVideoStore((s) => s.setSelectedRectangleId)
  const setSelectedCircleId = useUntrackedVideoStore((s) => s.setSelectedCircleId)
  const setSelectedFaceId = useUntrackedVideoStore((s) => s.setSelectedFaceId)
  const setSelectedLineId = useUntrackedVideoStore((s) => s.setSelectedLineId)
  const setSelectedLinePoint = useUntrackedVideoStore((s) => s.setSelectedLinePoint)
  const setIsDrawingLine = useUntrackedVideoStore((s) => s.setIsDrawingLine)
  const setSelectedPolyId = useUntrackedVideoStore((s) => s.setSelectedPolyId)

  const restorePoints = useCallback((pts: PointType[], scaleX: number, scaleY: number) => {
    return pts.map((p) => ({ ...p, x: p.x * scaleX, y: p.y * scaleY }))
  }, [])

  useEffect(() => {
    return () => {
      setPolygons({})
      setCircles({})
      setRectangles({})
      setFaces({})
      setLines({})
      setIsDrawingLine(null)
      setSelectedLineId(null)
      setSelectedLinePoint(null)
      setSelectedPolyPoint(null)
      setIsDrawingPolygon(null)
      setSelectedPolyId(null)
      setSelectedRectangleId(null)
      setSelectedCircleId(null)
      setSelectedFaceId(null)
    }
  }, [])

  const restoreAnnotations = useCallback(() => {
    const scaleX = imgSize.offsetWidth / imgSize.naturalWidth
    const scaleY = imgSize.offsetHeight / imgSize.naturalHeight
    const savedPolygons = fileObj?.metadata?.polygons || {}
    const savedRectangles = fileObj?.metadata?.rectangles || {}
    const savedCircles = fileObj?.metadata?.circles || {}
    const savedFaces = fileObj?.metadata?.faces || {}
    const savedLines = fileObj?.metadata?.lines || {}

    const scaledPolygons: VideoPolygonType = {}
    for (const frame of Object.keys(savedPolygons)) {
      if (!scaledPolygons[frame]) {
        scaledPolygons[frame] = []
      }

      for (const p of savedPolygons[frame] || []) {
        scaledPolygons[frame].push({ ...p, points: restorePoints(p.points, scaleX, scaleY) })
      }
    }

    const scaledLines: VideoLineType = {}
    for (const frame of Object.keys(savedLines)) {
      if (!scaledLines[frame]) {
        scaledLines[frame] = []
      }

      for (const l of savedLines[frame] || []) {
        scaledLines[frame].push({ ...l, points: restorePoints(l.points, scaleX, scaleY) })
      }
    }

    const scaledFaces: VideoFaceType = {}
    for (const frame of Object.keys(savedFaces)) {
      if (!scaledFaces[frame]) {
        scaledFaces[frame] = []
      }

      for (const f of savedFaces[frame] || []) {
        scaledFaces[frame].push({ ...f, points: restorePoints(f.points, scaleX, scaleY) })
      }
    }

    const scaledRectangles: VideoRectangleType = {}
    for (const frame of Object.keys(savedRectangles)) {
      if (!scaledRectangles[frame]) {
        scaledRectangles[frame] = []
      }

      for (const r of savedRectangles[frame] || []) {
        scaledRectangles[frame].push({
          ...r,
          height: r.height * scaleY,
          width: r.width * scaleX,
          x: r.x * scaleX,
          y: r.y * scaleY
        })
      }
    }

    const scaledCircles: VideoCircleType = {}
    for (const frame of Object.keys(savedCircles)) {
      if (!scaledCircles[frame]) {
        scaledCircles[frame] = []
      }

      for (const c of savedCircles[frame] || []) {
        scaledCircles[frame].push({
          ...c,
          height: c.height * scaleY,
          width: c.width * scaleX,
          x: c.x * scaleX,
          y: c.y * scaleY
        })
      }
    }

    setPolygons(scaledPolygons)
    setRectangles(scaledRectangles)
    setCircles(scaledCircles)
    setFaces(scaledFaces)
    setLines(scaledLines)
    setSelectedPolyPoint(null)
    setSelectedLinePoint(null)
    setIsDrawingPolygon(null)
    setIsDrawingLine(null)
    setSelectedPolyId(null)
    setSelectedRectangleId(null)
    setSelectedCircleId(null)
    setSelectedFaceId(null)
    setSelectedLineId(null)
  }, [fileObj, imgSize, restorePoints])

  useEffect(() => {
    restoreAnnotations()
  }, [restoreAnnotations])

  return (
    <Layer>
      <VideoPolygon
        calculateCurrentFrame={calculateCurrentFrame}
        selectCommentTab={selectCommentTab}
        stageRef={stageRef}
        imgSize={imgSize}
      />
      <VideoRectangle
        calculateCurrentFrame={calculateCurrentFrame}
        selectCommentTab={selectCommentTab}
        imgSize={imgSize}
      />
      <VideoCircle
        calculateCurrentFrame={calculateCurrentFrame}
        selectCommentTab={selectCommentTab}
        imgSize={imgSize}
      />
      <VideoFace
        calculateCurrentFrame={calculateCurrentFrame}
        selectCommentTab={selectCommentTab}
        stageRef={stageRef}
        imgSize={imgSize}
      />
      <VideoLine
        calculateCurrentFrame={calculateCurrentFrame}
        selectCommentTab={selectCommentTab}
        stageRef={stageRef}
        imgSize={imgSize}
      />
    </Layer>
  )
}

export default Shapes
