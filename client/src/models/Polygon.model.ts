import PointType from './Point.model'

type PolygonType = {
  id: string
  name: string
  notes: string
  points: PointType[]
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

export default PolygonType

export type VideoPolygonType = { [frame: number]: PolygonType[] }
