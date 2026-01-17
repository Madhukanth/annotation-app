import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { Layer, Stage } from 'react-konva'
import { Stage as StageType } from 'konva/lib/Stage'

import StaticPolygon from '@renderer/components/shapes/StaticPolygon'
import PolygonType from '@models/Polygon.model'
import PointType from '@models/Point.model'
import RectangleType from '@models/Rectangle.model'
import CircleType from '@models/Circle.model'
import FaceType from '@models/Face.model'
import StaticRectangle from '@renderer/components/shapes/StaticRectangle'
import StaticCircle from '@renderer/components/shapes/StaticCircle'
import StaticFace from '@renderer/components/shapes/StaticFace'
import FileType from '@models/File.model'
import OutlineButton from '@renderer/components/common/OutlineButton'
import { BsFillCheckCircleFill } from 'react-icons/bs'
import LineType from '@models/Line.model'
import StaticLine from '@renderer/components/shapes/StaticLine'
import { useOrgStore } from '@renderer/store/organization.store'
import { BiX } from 'react-icons/bi'
import { FileStatus } from './ProjectReview'
import { useSearchParams } from 'react-router-dom'

type ImgSize = { height: number; width: number }
type StageScale = { height: number; width: number; offsetTop: number; offsetLeft: number }
type ReviewCardProp = {
  image: FileType
  polygons: PolygonType[]
  rectangles: RectangleType[]
  circles: CircleType[]
  faces: FaceType[]
  lines: LineType[]
  limit: number
  skip: number
  selectedAnnotatorId: string | undefined
  filterDate?: Date
  fileStatus?: FileStatus
  filterTags?: string[]
  isClassification?: boolean
}

const ReviewCard: FC<ReviewCardProp> = ({
  skip,
  image,
  polygons,
  rectangles,
  circles,
  faces,
  lines,
  selectedAnnotatorId,
  fileStatus,
  filterDate,
  filterTags,
  isClassification
}) => {
  const [searchParams] = useSearchParams()
  const projectSkip = Number(searchParams.get('projectSkip') || 0)
  const projectLimit = Number(searchParams.get('projectLimit') || 20)
  const formatedDate = new Date(image.createdAt).toDateString()

  const orgId = useOrgStore((s) => s.selectedOrg)
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
      <div className="flex justify-center items-center h-44 bg-black rounded-t-lg">
        <div className="relative h-full w-full flex justify-center items-center">
          <img
            className="max-h-full max-w-full"
            src={image.url}
            ref={imgRef}
            alt={image.originalName}
            onLoad={handleImgLoad}
          />

          {showShapes && (
            <Stage
              ref={stageRef}
              width={stageScale.width * imgSize.width}
              height={stageScale.height * imgSize.height}
              style={{ top: stageScale.offsetTop, left: stageScale.offsetLeft }}
              className="absolute"
            >
              <Layer>
                {polygons.map((polygon) => (
                  <StaticPolygon
                    key={polygon.id}
                    stroke={polygon.stroke}
                    strokeWidth={polygon.strokeWidth}
                    shapeProps={{ ...polygon, points: getPoints(polygon.points.slice()) }}
                  />
                ))}

                {lines.map((line) => (
                  <StaticLine
                    key={line.id}
                    stroke={line.stroke}
                    strokeWidth={line.strokeWidth}
                    shapeProps={{ ...line, points: getPoints(line.points.slice()) }}
                  />
                ))}

                {rectangles.map((rect) => (
                  <StaticRectangle
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
                  <StaticCircle
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
                  <StaticFace
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
        <div className="flex items-center">
          <p className="text-lg text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap w-[calc(100%-20px)]">
            {image.originalName}
          </p>
          {image.complete && (
            <div className="ml-2 text-green-500">
              <BsFillCheckCircleFill />
            </div>
          )}

          {image.skipped && (
            <div className="ml-2 bg-red-500 text-white rounded-full">
              <BiX />
            </div>
          )}
        </div>
        <p className="text-gray-400 text-sm">{formatedDate}</p>
        <div className="flex justify-between mt-4">
          <OutlineButton
            link
            to={
              `/${isClassification ? 'review-classify' : 'review'}/orgs/${orgId}/projects/${image.projectId
              }?limit=${100}&skip=${skip}` +
              (selectedAnnotatorId ? `&annotator=${selectedAnnotatorId}` : '') +
              (fileStatus ? `&complete=${fileStatus === 'complete' ? 'true' : 'false'}` : '') +
              (fileStatus ? `&skipped=${fileStatus === 'skipped' ? 'true' : 'false'}` : '') +
              (fileStatus === 'annotated' ? '&hasShapes=true' : '') +
              (filterDate && fileStatus === 'complete'
                ? `&completedAfter=${filterDate.toISOString()}`
                : '') +
              (filterDate && fileStatus === 'skipped'
                ? `&skippedAfter=${filterDate.toISOString()}`
                : '') +
              (filterTags && filterTags.length > 0 ? `&tags=${filterTags.join(',')}` : '') +
              `&projectSkip=${projectSkip}&projectLimit=${projectLimit}`
            }
          >
            Review
          </OutlineButton>
        </div>
      </div>
    </div>
  )
}

export default ReviewCard
