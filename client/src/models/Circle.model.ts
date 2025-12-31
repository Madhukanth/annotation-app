type CircleType = {
  id: string
  name: string
  notes: string
  x: number
  y: number
  stroke: string
  strokeWidth: number
  height: number
  width: number
  orgId: string
  projectId: string
  fileId: string
  classId?: string
  attribute?: string
  text?: string
  ID?: string
}

export default CircleType

export type VideoCircleType = { [frame: number]: CircleType[] }
