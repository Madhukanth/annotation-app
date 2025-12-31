import CircleType from '@models/Circle.model'
import { FC } from 'react'
import { Circle } from 'react-konva'

type SimpleCircleProps = { shapeProps: CircleType; stroke: string }
const SimpleCircle: FC<SimpleCircleProps> = ({ shapeProps, stroke }) => {
  const rgb = stroke.match(/\d+/g)
  const fill = rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5)` : 'rgba(255, 0, 0, 0.6)'

  return <Circle {...shapeProps} stroke={stroke} fill={fill} />
}

export default SimpleCircle
