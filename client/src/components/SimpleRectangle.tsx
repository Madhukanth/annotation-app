import RectangleType from '@models/Rectangle.model'
import { FC } from 'react'
import { Rect } from 'react-konva'

type SimpleRectangleProps = { shapeProps: RectangleType; stroke: string }
const SimpleRectangle: FC<SimpleRectangleProps> = ({ shapeProps, stroke }) => {
  const rgb = stroke.match(/\d+/g)
  const fill = rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.5)` : 'rgba(255, 0, 0, 0.6)'

  return <Rect {...shapeProps} stroke={stroke} fill={fill} />
}

export default SimpleRectangle
