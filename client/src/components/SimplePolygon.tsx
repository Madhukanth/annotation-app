import { FC } from 'react'
import { Line } from 'react-konva'

import PolygonType from '@models/Polygon.model'

type PolygonProps = {
  shapeProps: PolygonType
  strokeWidth: number
  stroke: string
}

const SimplePolygon: FC<PolygonProps> = ({ shapeProps, strokeWidth, stroke }) => {
  const linePoints: number[] = []
  for (const point of shapeProps.points) {
    linePoints.push(point.x)
    linePoints.push(point.y)
  }

  const rgb = stroke.match(/\d+/g)
  const fill = rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5)` : 'rgba(255, 0, 0, 0.6)'

  return (
    <Line
      {...shapeProps}
      closed
      strokeWidth={strokeWidth}
      stroke={stroke}
      points={linePoints}
      fill={fill}
    />
  )
}

export default SimplePolygon
