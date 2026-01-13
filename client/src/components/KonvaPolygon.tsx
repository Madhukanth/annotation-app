import { useRef, useState, Fragment, FC, RefObject } from 'react'
import { Line, Circle } from 'react-konva'
import { Line as LineType } from 'konva/lib/shapes/Line'
import { KonvaEventObject } from 'konva/lib/Node'
import Konva from 'konva'

import PolygonType from '@models/Polygon.model'
import PointType from '@models/Point.model'
import { generateId } from '@renderer/utils/vars'
import { useImageUntrackedStore } from '@renderer/pages/ImageAnnotate/store/image.store'

type PolygonProps = {
  stageRef: RefObject<Konva.Stage>
  shapeProps: PolygonType
  isSelected: boolean
  isDrawing: true | string | null
  strokeWidth: number
  stroke: string
  onSelect: () => void
  onChange: (shapeProps: PolygonType) => void
  onPointClick: ({ polyId, pointId }: { polyId: string; pointId: string }) => void
  selectedPointId: string | null
  selectCommentTab: () => void
}

const Polygon: FC<PolygonProps> = ({
  stageRef,
  shapeProps,
  isSelected,
  onSelect,
  onChange,
  strokeWidth,
  stroke,
  onPointClick,
  selectedPointId,
  isDrawing
}) => {
  const [transforming, setTransforming] = useState(false)

  const drawingShape = useImageUntrackedStore((s) => s.drawingShape)

  const shapeRef = useRef<LineType>(null)

  function handlePolyDrag() {
    if (!shapeRef.current || !stageRef.current) return []

    const absolutePoints: PointType[] = []
    const points = shapeRef.current.points()
    const transform = shapeRef.current.getAbsoluteTransform()

    let i = 0
    while (i < points.length) {
      const point: Omit<PointType, 'id'> = {
        x: points[i],
        y: points[i + 1]
      }
      absolutePoints.push({ id: generateId(), ...transform.point({ x: point.x, y: point.y }) })
      i = i + 2
    }

    const stageScale = stageRef.current.scaleX()
    const stageX = stageRef.current.x()
    const stageY = stageRef.current.y()
    const updatedPoints = absolutePoints.map((point) => ({
      ...point,
      x: (point.x - stageX) / stageScale,
      y: (point.y - stageY) / stageScale
    }))

    return updatedPoints
  }

  const onPolyClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    onSelect()
  }

  const onCircleClick = (pointId: PointType['id']) => (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    onPointClick({ polyId: shapeProps.id, pointId })
  }

  const handleDragStart = () => {
    setTransforming(true)
  }

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    if (!shapeRef.current) return

    setTransforming(false)
    const newPoints = handlePolyDrag()
    onChange({ ...shapeProps, points: newPoints })
    e.target.position({ x: 0, y: 0 })
  }

  const handleCircleDragEnd = (pointId: string) => (e: KonvaEventObject<DragEvent>) => {
    const newPoints = shapeProps.points.map((point) => {
      if (point.id !== pointId) return point
      return { ...point, x: e.target.x(), y: e.target.y() }
    })

    onChange({ ...shapeProps, points: newPoints })
  }

  const linePoints: number[] = []
  for (const point of shapeProps.points) {
    linePoints.push(point.x)
    linePoints.push(point.y)
  }

  const showCircles = isDrawing === shapeProps.id || (!transforming && isSelected)

  const rgb = stroke.match(/\d+/g)
  const fill = rgb ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, 0.3)` : 'rgba(255, 0, 0, 0.3)'

  return (
    <Fragment>
      {shapeProps.points && shapeProps.points.length > 1 && (
        <Line
          {...shapeProps}
          draggable={!drawingShape}
          closed
          ref={shapeRef}
          strokeWidth={strokeWidth}
          onClick={onPolyClick}
          stroke={stroke}
          points={linePoints}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          fill={fill}
        />
      )}

      {showCircles &&
        shapeProps.points.map((point, i) => {
          const highlight = (i === 0 && isDrawing) || selectedPointId === point.id
          return (
            <Circle
              id={point.id}
              x={point.x}
              y={point.y}
              key={point.id}
              radius={highlight ? 4 : 3}
              fill={highlight ? stroke : 'white'}
              stroke="white"
              strokeWidth={2}
              rotateEnabled={false}
              draggable
              onDragEnd={handleCircleDragEnd(point.id)}
              onClick={onCircleClick(point.id)}
            />
          )
        })}
    </Fragment>
  )
}

export default Polygon
