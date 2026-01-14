import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { Layer, Stage } from 'react-konva'
import { Link } from 'react-router-dom'
import { Stage as StageType } from 'konva/lib/Stage'

import SimplePolygon from '@/components/shapes/simple/SimplePolygon'
import PolygonType from '@models/Polygon.model'
import { ImageModel } from '@models/image.model'
import PointType from '@models/Point.model'
import RectangleType from '@models/Rectangle.model'
import CircleType from '@models/Circle.model'
import SimpleRectangle from '@/components/shapes/simple/SimpleRectangle'
import SimpleCircle from '@/components/shapes/simple/SimpleCircle'
import FaceType from '@models/Face.model'
import SimpleFace from '@/components/shapes/simple/SimpleFace'
import LineType from '@models/Line.model'
import SimpleLine from '@/components/shapes/simple/SimpleLine'

type ImgSize = { height: number; width: number }
type StageScale = { height: number; width: number; offsetTop: number; offsetLeft: number }
type RedactedImageCardProp = {
  image: ImageModel
  polygons: PolygonType[]
  rectangles: RectangleType[]
  circles: CircleType[]
  faces: FaceType[]
  lines: LineType[]
  onDelete: () => void
}

const RedactedImageCard: FC<RedactedImageCardProp> = ({
  image,
  polygons,
  rectangles,
  circles,
  faces,
  lines,
  onDelete
}) => {
  const [imgSize, setImgSize] = useState<ImgSize>({ height: 500, width: 500 })
  const [stageScale, setStageScale] = useState<StageScale>({
    height: 1,
    width: 1,
    offsetTop: 0,
    offsetLeft: 0
  })
  const [showShapes, setShowShapes] = useState(false)

  const imgRef = useRef<HTMLImageElement>(null)
  const stageRef = useRef<StageType | null>(null)

  const handleWindowResize = useCallback(() => {
    if (!imgRef.current) return

    const { naturalHeight, naturalWidth, offsetHeight, offsetWidth, offsetTop, offsetLeft } =
      imgRef.current

    setStageScale({
      height: offsetHeight / naturalHeight,
      width: offsetWidth / naturalWidth,
      offsetLeft,
      offsetTop
    })
  }, [])

  const handleImgLoad = useCallback(() => {
    if (!imgRef.current) return

    const naturalHeight = imgRef.current.naturalHeight
    const naturalWidth = imgRef.current.naturalWidth
    setImgSize({ height: naturalHeight, width: naturalWidth })
    handleWindowResize()
    setShowShapes(true)
  }, [handleWindowResize])

  useEffect(() => {
    window.addEventListener('resize', handleWindowResize)

    return () => {
      window.removeEventListener('resize', handleWindowResize)
    }
  }, [handleWindowResize])

  const getPoints = (points: PointType[]) => {
    return points.map((pnt) => ({
      id: pnt.id,
      x: pnt.x * stageScale.width,
      y: pnt.y * stageScale.height
    }))
  }

  return (
    <div className="rounded-lg border border-gray-300 h-fit">
      <div className="flex justify-center items-center h-64 bg-black rounded-t-lg">
        <div className="relative h-full w-full flex justify-center items-center">
          <img
            className="max-h-full max-w-full"
            src={`stechfile://${image.absPath}`}
            ref={imgRef}
            alt={image.name}
            onLoad={handleImgLoad}
          />

          {showShapes && (
            <Stage
              ref={stageRef}
              width={stageScale.width * imgSize.width}
              height={stageScale.height * imgSize.height}
              style={{ top: stageScale.offsetTop, left: stageScale.offsetLeft }}
              className="absolute z-10"
            >
              <Layer>
                {polygons.map((polygon) => (
                  <SimplePolygon
                    key={polygon.id}
                    stroke={polygon.stroke}
                    strokeWidth={polygon.strokeWidth}
                    shapeProps={{ ...polygon, points: getPoints(polygon.points.slice()) }}
                  />
                ))}

                {lines.map((line) => (
                  <SimpleLine
                    key={line.id}
                    stroke={line.stroke}
                    strokeWidth={line.strokeWidth}
                    shapeProps={{ ...line, points: getPoints(line.points.slice()) }}
                  />
                ))}

                {rectangles.map((rect) => (
                  <SimpleRectangle
                    key={rect.id}
                    shapeProps={{
                      ...rect,
                      x: rect.x * stageScale.width,
                      y: rect.y * stageScale.height,
                      width: rect.width * stageScale.width,
                      height: rect.height * stageScale.height
                    }}
                    stroke={rect.stroke}
                  />
                ))}

                {circles.map((circle) => (
                  <SimpleCircle
                    key={circle.id}
                    shapeProps={{
                      ...circle,
                      x: circle.x * stageScale.width,
                      y: circle.y * stageScale.height,
                      width: circle.width * stageScale.width,
                      height: circle.height * stageScale.height
                    }}
                    stroke={circle.stroke}
                  />
                ))}

                {faces.map((face) => (
                  <SimpleFace
                    key={face.id}
                    stroke={face.stroke}
                    strokeWidth={face.strokeWidth}
                    shapeProps={{ ...face, points: getPoints(face.points.slice()) }}
                  />
                ))}
              </Layer>
            </Stage>
          )}
        </div>
      </div>

      <div className="p-4">
        <p className="text-xl text-gray-900">{image.name}</p>
        <p className="text-neutral-400">{image.createdAt}</p>
        <div className="flex justify-between mt-4">
          <Link
            to={`/images/${image.id}`}
            className="rounded-3xl text-brand1 border text-sm border-gray-300 py-2 px-4"
          >
            Reannotate
          </Link>
          <button
            onClick={onDelete}
            className="rounded-3xl text-red-500 border text-sm border-gray-300 py-2 px-4"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default RedactedImageCard
