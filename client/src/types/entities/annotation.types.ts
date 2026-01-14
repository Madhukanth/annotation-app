/**
 * Annotation Types
 * Annotation metadata for images and videos
 */

import {
  Rectangle,
  Circle,
  Polygon,
  Face,
  Line,
  VideoRectangle,
  VideoCircle,
  VideoPolygon,
  VideoFace,
  VideoLine,
} from '../shapes'

// Union of all shape types
export type ShapeUnion = Rectangle | Circle | Polygon | Face | Line

// Image annotation metadata
export interface Annotation {
  rectangles: Rectangle[]
  circles: Circle[]
  polygons: Polygon[]
  faces: Face[]
  lines: Line[]
  [key: string]: ShapeUnion[]
}

// Video annotation metadata (keyed by frame)
export interface VideoAnnotation {
  rectangles: VideoRectangle
  circles: VideoCircle
  polygons: VideoPolygon
  faces: VideoFace
  lines: VideoLine
}
