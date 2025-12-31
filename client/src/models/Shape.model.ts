import PointType from './Point.model'

export const shapesAvailable = ['polygon', 'rectangle', 'circle', 'face', 'line', 'ai'] as const
export type ShapesAvailableType = (typeof shapesAvailable)[number]

export type ShapeType = {
  id: string
  type: ShapesAvailableType
  name: string
  notes: string
  stroke: string
  strokeWidth: number
  orgId: string
  projectId: string
  fileId: string
  color: string
  text?: string
  ID?: string
  attribute?: string
  classId?: string
  x?: number
  y?: number
  height?: number
  width?: number
  points?: PointType[]
  atFrame: number
}
