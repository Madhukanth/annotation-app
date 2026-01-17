import { FC, Fragment, useEffect, useRef } from 'react'
import { Rect, Transformer } from 'react-konva'
import { Rect as RectType } from 'konva/lib/shapes/Rect'
import { Transformer as TransformerType } from 'konva/lib/shapes/Transformer'
import { KonvaEventObject } from 'konva/lib/Node'

import RectangleType from '@models/Rectangle.model'
import { useImageUntrackedStore } from '@/features/image-annotation'

type KonvaRectangleProp = {
  shapeProps: RectangleType
  isSelected: boolean
  stroke: string
  selectCommentTab: () => void
  selectRectangle: (rectId: string) => void
  updateRectangle: (updatedRect: RectangleType) => void
}
const KonvaRectangle: FC<KonvaRectangleProp> = ({
  stroke,
  shapeProps,
  selectRectangle,
  isSelected,
  updateRectangle
}) => {
  const shapeRef = useRef<RectType>(null)
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
    selectRectangle(shapeProps.id)
  }

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    updateRectangle({
      ...shapeProps,
      x: e.target.x(),
      y: e.target.y()
    })
  }

  const handleTransformEnd = () => {
    // transformer is changing scale of the node
    // and NOT its width or height
    // but in the store we have only width and height
    // to match the data better we will reset scale on transform end
    const node = shapeRef.current
    if (!node) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // we will reset it back
    node.scaleX(1)
    node.scaleY(1)
    updateRectangle({
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
      <Rect
        {...shapeProps}
        draggable={!drawingShape}
        stroke={stroke}
        ref={shapeRef}
        fill={fill}
        onClick={handleOnClick}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
      />

      {isSelected && (
        <Transformer
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

export default KonvaRectangle
