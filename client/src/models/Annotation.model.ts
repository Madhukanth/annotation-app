import CircleType from './Circle.model'
import FaceType from './Face.model'
import LineType from './Line.model'
import PolygonType from './Polygon.model'
import RectangleType from './Rectangle.model'

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
