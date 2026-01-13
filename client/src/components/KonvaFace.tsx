import { useRef, useState, Fragment, FC, RefObject } from 'react'
import { Line, Circle, Group } from 'react-konva'
import { Line as LineType } from 'konva/lib/shapes/Line'
import { Group as GroupType } from 'konva/lib/Group'
import { KonvaEventObject } from 'konva/lib/Node'

import PointType from '@models/Point.model'
import FaceType from '@models/Face.model'
import Konva from 'konva'
import { generateId } from '@renderer/utils/vars'
import { useImageUntrackedStore } from '@renderer/pages/ImageAnnotate/store/image.store'

type KonvaFaceProps = {
  stageRef: RefObject<Konva.Stage>
  shapeProps: FaceType
  isSelected: boolean
  strokeWidth: number
  stroke: string
  selectCommentTab: () => void
  onSelect: () => void
  onChange: (shapeProps: FaceType) => void
}

const KonvaFace: FC<KonvaFaceProps> = ({
  stageRef,
  shapeProps,
  isSelected,
  onSelect,
  onChange,
  strokeWidth,
  stroke
}) => {
  const [transforming, setTransforming] = useState(false)
  const drawingShape = useImageUntrackedStore((s) => s.drawingShape)

  const groupRef = useRef<GroupType>(null)
  const faceOutlineRef = useRef<LineType>(null)
  const leftEyebrowRef = useRef<LineType>(null)
  const rightEyebrowRef = useRef<LineType>(null)
  const leftEyeRef = useRef<LineType>(null)
  const rightEyeRef = useRef<LineType>(null)
  const noseRef = useRef<LineType>(null)
  const mouthRef = useRef<LineType>(null)

  function handlePolyDrag(lineRef: RefObject<LineType>) {
    if (!lineRef.current || !stageRef.current) return []

    const absolutePoints: PointType[] = []
    const points = lineRef.current.points()
    const transform = lineRef.current.getAbsoluteTransform()

    let i = 0
    while (i < points.length) {
      const point: Omit<PointType, 'id'> = {
        x: points[i],
        y: points[i + 1]
      }
      absolutePoints.push({ id: generateId(), ...transform.point({ x: point.x, y: point.y }) })
      i = i + 2
    }

    const oldScale = stageRef.current.scaleX()
    const stageX = stageRef.current.x()
    const stageY = stageRef.current.y()
    const updatedPoints = absolutePoints.map((point) => ({
      ...point,
      x: point.x / oldScale - stageX / oldScale,
      y: point.y / oldScale - stageY / oldScale
    }))

    return updatedPoints
  }

  const onPolyClick = (e: KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    onSelect()
  }

  const handleDragStart = () => {
    setTransforming(true)
  }

  const handleDragEnd = (e: KonvaEventObject<DragEvent>) => {
    setTransforming(false)
    const faceOutlinePoints = handlePolyDrag(faceOutlineRef)
    const leftEyebrowPoints = handlePolyDrag(leftEyebrowRef)
    const rightEyebrowPoints = handlePolyDrag(rightEyebrowRef)
    const leftEyePoints = handlePolyDrag(leftEyeRef)
    const rightEyePoints = handlePolyDrag(rightEyeRef)
    const nosePoints = handlePolyDrag(noseRef)
    const mouthPoints = handlePolyDrag(mouthRef)

    onChange({
      ...shapeProps,
      points: [
        faceOutlinePoints[0],
        faceOutlinePoints[1],
        faceOutlinePoints[3],
        faceOutlinePoints[5],
        faceOutlinePoints[7],
        faceOutlinePoints[9],
        faceOutlinePoints[11],
        faceOutlinePoints[13],
        leftEyebrowPoints[0],
        leftEyebrowPoints[1],
        leftEyebrowPoints[3],
        rightEyebrowPoints[0],
        rightEyebrowPoints[1],
        rightEyebrowPoints[3],
        leftEyePoints[0],
        leftEyePoints[1],
        leftEyePoints[3],
        leftEyePoints[5],
        leftEyePoints[7],
        rightEyePoints[0],
        rightEyePoints[1],
        rightEyePoints[3],
        rightEyePoints[5],
        rightEyePoints[7],
        nosePoints[0],
        nosePoints[1],
        nosePoints[3],
        mouthPoints[0],
        mouthPoints[1],
        mouthPoints[3],
        mouthPoints[5]
      ]
    })
    e.target.position({ x: 0, y: 0 })
  }

  const handleCircleDragEnd = (pointId: string) => (e: KonvaEventObject<DragEvent>) => {
    const newPoints = shapeProps.points.map((point) => {
      if (point.id !== pointId) return point
      return { ...point, x: e.target.x(), y: e.target.y() }
    })

    onChange({ ...shapeProps, points: newPoints })
  }

  const allPoints = [...shapeProps.points]
  const pointsToTypeMap = {
    faceOutline: [
      allPoints[0],
      allPoints[1],
      allPoints[1],
      allPoints[2],
      allPoints[2],
      allPoints[3],
      allPoints[3],
      allPoints[4],
      allPoints[4],
      allPoints[5],
      allPoints[5],
      allPoints[6],
      allPoints[6],
      allPoints[7],
      allPoints[7],
      allPoints[0]
    ],
    leftEyebrow: [allPoints[8], allPoints[9], allPoints[9], allPoints[10]],
    rightEyebrow: [allPoints[11], allPoints[12], allPoints[12], allPoints[13]],
    leftEye: [
      allPoints[14],
      allPoints[15],
      allPoints[15],
      allPoints[16],
      allPoints[16],
      allPoints[17],
      allPoints[17],
      allPoints[18],
      allPoints[17],
      allPoints[14]
    ],
    rightEye: [
      allPoints[19],
      allPoints[20],
      allPoints[20],
      allPoints[21],
      allPoints[21],
      allPoints[22],
      allPoints[22],
      allPoints[23],
      allPoints[22],
      allPoints[19]
    ],
    nose: [allPoints[24], allPoints[25], allPoints[25], allPoints[26]],
    mouth: [
      allPoints[27],
      allPoints[28],
      allPoints[28],
      allPoints[29],
      allPoints[29],
      allPoints[30],
      allPoints[30],
      allPoints[27]
    ]
  }

  return (
    <Fragment>
      <Group
        ref={groupRef}
        draggable={!drawingShape}
        onClick={onPolyClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Line
          ref={faceOutlineRef}
          closed
          strokeWidth={strokeWidth}
          stroke={stroke}
          points={pointsToTypeMap.faceOutline.map((p) => [p.x, p.y]).flat()}
        />

        <Line
          ref={leftEyebrowRef}
          closed
          strokeWidth={strokeWidth}
          stroke={stroke}
          points={pointsToTypeMap.leftEyebrow.map((p) => [p.x, p.y]).flat()}
        />

        <Line
          closed
          ref={rightEyebrowRef}
          strokeWidth={strokeWidth}
          stroke={stroke}
          points={pointsToTypeMap.rightEyebrow.map((p) => [p.x, p.y]).flat()}
        />

        <Line
          ref={leftEyeRef}
          closed
          strokeWidth={strokeWidth}
          stroke={stroke}
          points={pointsToTypeMap.leftEye.map((p) => [p.x, p.y]).flat()}
        />

        <Line
          ref={rightEyeRef}
          closed
          strokeWidth={strokeWidth}
          stroke={stroke}
          points={pointsToTypeMap.rightEye.map((p) => [p.x, p.y]).flat()}
        />

        <Line
          ref={noseRef}
          closed
          strokeWidth={strokeWidth}
          stroke={stroke}
          points={pointsToTypeMap.nose.map((p) => [p.x, p.y]).flat()}
        />

        <Line
          ref={mouthRef}
          closed
          strokeWidth={strokeWidth}
          stroke={stroke}
          points={pointsToTypeMap.mouth.map((p) => [p.x, p.y]).flat()}
        />
      </Group>

      {!transforming &&
        isSelected &&
        shapeProps.points.map((point, i) => {
          return (
            <Circle
              id={point.id}
              x={point.x}
              y={point.y}
              key={point.id}
              radius={3}
              fill={'white'}
              stroke="white"
              strokeWidth={2}
              rotateEnabled={false}
              name={i.toString()}
              draggable
              onDragEnd={handleCircleDragEnd(point.id)}
            />
          )
        })}
    </Fragment>
  )
}

export default KonvaFace
