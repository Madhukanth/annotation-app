import { FC, Fragment, useEffect, useRef } from 'react'
import { Circle, Transformer } from 'react-konva'
import { Circle as CircleKonvaType } from 'konva/lib/shapes/Circle'
import { Transformer as TransformerType } from 'konva/lib/shapes/Transformer'
import { KonvaEventObject } from 'konva/lib/Node'

import CircleType from '@models/Circle.model'
import VideoCircleType from '@models/VideoCircle.model'
import { useImageUntrackedStore } from '@renderer/pages/ImageAnnotate/store/image.store'

type KonvaCircleProps = {
  shapeProps: CircleType | VideoCircleType
  isSelected: boolean
  stroke: string
  selectCommentTab: () => void
  selectCircle: (circleId: string) => void
  updateCircle: (updatedCircle: CircleType | VideoCircleType) => void
}

const KonvaCircle: FC<KonvaCircleProps> = ({
  isSelected,
  selectCircle,
  shapeProps,
  updateCircle,
  stroke
}) => {
  const shapeRef = useRef<CircleKonvaType>(null)
  const trRef = useRef<TransformerType>(null)
  const drawingShape = useImageUntrackedStore((s) => s.drawingShape)

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      // we need to attach transformer manually
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  const handleOnClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    selectCircle(shapeProps.id)
  }

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    updateCircle({
      ...shapeProps,
      x: e.target.x(),
      y: e.target.y()
    })
  }

  const handleTransformEnd = () => {
    const node = shapeRef.current
    if (!node) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // we will reset it back
    node.scaleX(1)
    node.scaleY(1)
    updateCircle({
      ...shapeProps,
      x: node.x(),
      y: node.y(),
      width: node.width() * scaleX,
      height: node.height() * scaleY
    })
  }

  const rgb = stroke.match(/\d+/g)
  const fill = rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.3)` : 'rgba(255, 0, 0, 0.3)'

  return (
    <Fragment>
      <Circle
        {...shapeProps}
        draggable={!drawingShape}
        stroke={stroke}
        ref={shapeRef}
        onClick={handleOnClick}
        fill={fill}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />

      {isSelected && (
        <Transformer
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          ref={trRef}
          anchorFill="white"
          anchorCornerRadius={10}
          anchorStrokeWidth={0}
          rotateEnabled={false}
          borderStrokeWidth={0}
        />
      )}
    </Fragment>
  )
}

export default KonvaCircle
