import PointType from './Point.model'

type FaceType = {
  id: string
  name: string
  notes: string
  points: PointType[]
  stroke: string
  strokeWidth: number
  closed: boolean
  orgId: string
  projectId: string
  fileId: string
  classId?: string
  attribute?: string
  text?: string
  ID?: string
}

export default FaceType

export type VideoFaceType = { [frame: number]: FaceType[] }
