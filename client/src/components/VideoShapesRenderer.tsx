import { FC, Fragment, RefObject, useCallback, useEffect, useState } from 'react'

import { VideoCircleType } from '@models/Circle.model'
import { VideoPolygonType } from '@models/Polygon.model'
import { VideoRectangleType } from '@models/Rectangle.model'
import SimplePolygon from './SimplePolygon'
import SimpleRectangle from './SimpleRectangle'
import SimpleCircle from './SimpleCircle'
import PointType from '@models/Point.model'
import { VideoFaceType } from '@models/Face.model'
import SimpleFace from './SimpleFace'

type StageScale = { height: number; width: number; offsetTop: number; offsetLeft: number }
type VideoShapesRendererProps = {
  polygons: VideoPolygonType
  rectangles: VideoRectangleType
  circles: VideoCircleType
  faces: VideoFaceType
  stageScale: StageScale
  videoRef: RefObject<HTMLVideoElement>
  fps: number
}
const VideoShapesRenderer: FC<VideoShapesRendererProps> = ({
  polygons,
  rectangles,
  circles,
  faces,
  stageScale,
  videoRef,
  fps
}) => {
  const [currentFrame, setCurrentFrame] = useState(0)

  const frameCallbackHandler = useCallback(() => {
    if (!videoRef?.current) return

    const videoCurrentTime = videoRef.current.currentTime
    const newFrame = Math.round(videoCurrentTime * fps)
    setCurrentFrame(newFrame)
    videoRef.current.requestVideoFrameCallback(frameCallbackHandler)
  }, [fps, videoRef])

  useEffect(() => {
    if (!videoRef?.current) return

    const videoEle = videoRef.current
    videoEle.requestVideoFrameCallback(frameCallbackHandler)
  }, [frameCallbackHandler])

  const getPoints = (points: PointType[]) => {
    return points.map((pnt) => ({
      id: pnt.id,
      x: pnt.x * stageScale.width,
      y: pnt.y * stageScale.height
    }))
  }

  return (
    <Fragment>
      {(polygons[currentFrame] || []).map((poly) => (
        <SimplePolygon
          stroke={poly.stroke}
          strokeWidth={poly.strokeWidth}
          key={poly.id}
          shapeProps={{ ...poly, points: getPoints(poly.points) }}
        />
      ))}

      {(rectangles[currentFrame] || []).map((rect) => (
        <SimpleRectangle
          key={rect.id}
          stroke={rect.stroke}
          shapeProps={{
            ...rect,
            x: rect.x * stageScale.width,
            y: rect.y * stageScale.height,
            width: rect.width * stageScale.width,
            height: rect.height * stageScale.height
          }}
        />
      ))}

      {(circles[currentFrame] || []).map((circle) => (
        <SimpleCircle
          key={circle.id}
          stroke={circle.stroke}
          shapeProps={{
            ...circle,
            x: circle.x * stageScale.width,
            y: circle.y * stageScale.height,
            width: circle.width * stageScale.width,
            height: circle.height * stageScale.height
          }}
        />
      ))}

      {(faces[currentFrame] || []).map((face) => (
        <SimpleFace
          key={face.id}
          stroke={face.stroke}
          strokeWidth={face.strokeWidth}
          shapeProps={{ ...face, points: getPoints(face.points) }}
        />
      ))}
    </Fragment>
  )
}
export default VideoShapesRenderer
