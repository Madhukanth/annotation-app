import { FC } from 'react'
import { Line } from 'react-konva'

import PolygonType from '@models/Polygon.model'

type PolygonProps = {
  shapeProps: PolygonType
  strokeWidth: number
  stroke: string
}

const SimpleLine: FC<PolygonProps> = ({ shapeProps, strokeWidth, stroke }) => {
  const linePoints: number[] = []
  for (const point of shapeProps.points) {
    linePoints.push(point.x)
    linePoints.push(point.y)
  }

  return (
    <Line
      {...shapeProps}
      closed={false}
      strokeWidth={strokeWidth}
      stroke={stroke}
      points={linePoints}
    />
  )
}

export default SimpleLine
