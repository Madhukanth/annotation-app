import { useRef, Fragment, FC } from 'react'
import { Line, Group } from 'react-konva'
import { Line as LineType } from 'konva/lib/shapes/Line'
import { Group as GroupType } from 'konva/lib/Group'

import FaceType from '@models/Face.model'
import VideoFaceType from '@models/VideoFace.model'

type SimpleFaceProps = {
  shapeProps: FaceType | VideoFaceType
  strokeWidth: number
  stroke: string
}

const SimpleFace: FC<SimpleFaceProps> = ({ shapeProps, strokeWidth, stroke }) => {
  const groupRef = useRef<GroupType>(null)
  const faceOutlineRef = useRef<LineType>(null)
  const leftEyebrowRef = useRef<LineType>(null)
  const rightEyebrowRef = useRef<LineType>(null)
  const leftEyeRef = useRef<LineType>(null)
  const rightEyeRef = useRef<LineType>(null)
  const noseRef = useRef<LineType>(null)
  const mouthRef = useRef<LineType>(null)

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
      <Group ref={groupRef}>
        <Line
          ref={faceOutlineRef}
          closed={closed}
          strokeWidth={strokeWidth}
          stroke={stroke}
          points={pointsToTypeMap.faceOutline.map((p) => [p.x, p.y]).flat()}
        />

        <Line
          ref={leftEyebrowRef}
          strokeWidth={strokeWidth}
          stroke={stroke}
          points={pointsToTypeMap.leftEyebrow.map((p) => [p.x, p.y]).flat()}
        />

        <Line
          ref={rightEyebrowRef}
          strokeWidth={strokeWidth}
          stroke={stroke}
          points={pointsToTypeMap.rightEyebrow.map((p) => [p.x, p.y]).flat()}
        />

        <Line
          ref={leftEyeRef}
          closed={closed}
          strokeWidth={strokeWidth}
          stroke={stroke}
          points={pointsToTypeMap.leftEye.map((p) => [p.x, p.y]).flat()}
        />

        <Line
          ref={rightEyeRef}
          closed={closed}
          strokeWidth={strokeWidth}
          stroke={stroke}
          points={pointsToTypeMap.rightEye.map((p) => [p.x, p.y]).flat()}
        />

        <Line
          ref={noseRef}
          closed={closed}
          strokeWidth={strokeWidth}
          stroke={stroke}
          points={pointsToTypeMap.nose.map((p) => [p.x, p.y]).flat()}
        />

        <Line
          ref={mouthRef}
          closed={closed}
          strokeWidth={strokeWidth}
          stroke={stroke}
          points={pointsToTypeMap.mouth.map((p) => [p.x, p.y]).flat()}
        />
      </Group>
    </Fragment>
  )
}

export default SimpleFace
