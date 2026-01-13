import CircleType, { VideoCircleType } from './Circle.model'
import FaceType, { VideoFaceType } from './Face.model'
import LineType, { VideoLineType } from './Line.model'
import PolygonType, { VideoPolygonType } from './Polygon.model'
import RectangleType, { VideoRectangleType } from './Rectangle.model'

export type ShapeType = RectangleType | CircleType | PolygonType | FaceType | LineType

type AnnotationType = {
  rectangles: RectangleType[]
  circles: CircleType[]
  polygons: PolygonType[]
  faces: FaceType[]
  lines: LineType[]
  [key: string]: ShapeType[]
}

export default AnnotationType

export type VideoAnnotationType = {
  rectangles: VideoRectangleType
  circles: VideoCircleType
  polygons: VideoPolygonType
  faces: VideoFaceType
  lines: VideoLineType
}
