import PointType from './Point.model'

type LineType = {
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

export default LineType
