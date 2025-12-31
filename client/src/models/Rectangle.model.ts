type RectangleType = {
  id: string
  name: string
  notes: string
  x: number
  y: number
  stroke: string
  strokeWidth: number
  width: number
  height: number
  orgId: string
  projectId: string
  fileId: string
  classId?: string
  attribute?: string
  text?: string
  ID?: string
}

export default RectangleType

export type VideoRectangleType = { [frame: number]: RectangleType[] }
