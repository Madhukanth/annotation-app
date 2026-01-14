/**
 * Shape Types
 * All annotation shape definitions for image and video annotation
 */

import { Point } from './geometry.types'

// Available shape types
export const shapesAvailable = ['polygon', 'rectangle', 'circle', 'face', 'line', 'ai'] as const
export type ShapesAvailableType = (typeof shapesAvailable)[number]

// Base shape properties shared by all shapes
interface BaseShape {
  id: string
  name: string
  notes: string
  stroke: string
  strokeWidth: number
  orgId: string
  projectId: string
  fileId: string
  classId?: string
  attribute?: string
  text?: string
  ID?: string
}

// Generic shape type with all possible properties
export interface Shape extends BaseShape {
  type: ShapesAvailableType
  color: string
  x?: number
  y?: number
  height?: number
  width?: number
  points?: Point[]
  atFrame: number
}

// Rectangle shape
export interface Rectangle extends BaseShape {
  x: number
  y: number
  width: number
  height: number
}

// Circle shape (using width/height for ellipse)
export interface Circle extends BaseShape {
  x: number
  y: number
  width: number
  height: number
}

// Polygon shape (closed polygon with points)
export interface Polygon extends BaseShape {
  points: Point[]
}

// Line shape (open polyline with points)
export interface Line extends BaseShape {
  points: Point[]
}

// Face shape (polygon with closed flag)
export interface Face extends BaseShape {
  points: Point[]
  closed: boolean
}

// Union type for all shape types
export type AnyShape = Rectangle | Circle | Polygon | Line | Face

// Video shape types - keyed by frame number
export type VideoRectangle = { [frame: number]: Rectangle[] }
export type VideoCircle = { [frame: number]: Circle[] }
export type VideoPolygon = { [frame: number]: Polygon[] }
export type VideoLine = { [frame: number]: Line[] }
export type VideoFace = { [frame: number]: Face[] }
