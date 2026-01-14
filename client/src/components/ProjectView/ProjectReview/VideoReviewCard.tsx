import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { Layer, Stage } from 'react-konva'
import { Stage as StageType } from 'konva/lib/Stage'

import SimplePolygon from '@/components/shapes/simple/SimplePolygon'
import { VideoPolygonType } from '@models/Polygon.model'
import PointType from '@models/Point.model'
import { VideoRectangleType } from '@models/Rectangle.model'
import { VideoCircleType } from '@models/Circle.model'
import { VideoFaceType } from '@models/Face.model'
import SimpleRectangle from '@/components/shapes/simple/SimpleRectangle'
import SimpleCircle from '@/components/shapes/simple/SimpleCircle'
import SimpleFace from '@/components/shapes/simple/SimpleFace'
import { VideoFileType } from '@models/File.model'
import { getStoredUrl } from '@renderer/utils/vars'
import OutlineButton from '@/components/ui/OutlineButton'
import { BsFillCheckCircleFill } from 'react-icons/bs'
import { VideoLineType } from '@models/Line.model'
import SimpleLine from '@/components/shapes/simple/SimpleLine'
import VideoControls from '@renderer/pages/VideoAnnotate/VideoControls/VideoControls'
import { useOrgStore } from '@renderer/store/organization.store'

type VideoSize = { height: number; width: number }
type StageScale = { height: number; width: number; offsetTop: number; offsetLeft: number }
type VideoReviewCardProp = {
  video: VideoFileType
  polygons: VideoPolygonType
  rectangles: VideoRectangleType
  circles: VideoCircleType
  faces: VideoFaceType
  lines: VideoLineType
}

const VideoReviewCard: FC<VideoReviewCardProp> = ({
  video,
  polygons,
  rectangles,
  circles,
  faces,
  lines
}) => {
  const formatedDate = new Date(video.createdAt).toDateString()

  const orgId = useOrgStore((s) => s.selectedOrg)
  const [imgSize, setImgSize] = useState<VideoSize>({ height: 500, width: 500 })
  const [stageScale, setStageScale] = useState<StageScale>({
    height: 1,
    width: 1,
    offsetTop: 0,
    offsetLeft: 0
  })
  const [showShapes, setShowShapes] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const stageRef = useRef<StageType | null>(null)

  const handleWindowResize = useCallback(() => {
    if (!videoRef.current) return

    const { videoHeight, videoWidth, offsetHeight, offsetWidth, offsetTop, offsetLeft } =
      videoRef.current

    setStageScale({
      height: offsetHeight / videoHeight,
      width: offsetWidth / videoWidth,
      offsetLeft,
      offsetTop
    })
  }, [])

  const handleImgLoad = useCallback(() => {
    if (!videoRef.current) return

    const naturalHeight = videoRef.current.videoHeight
    const naturalWidth = videoRef.current.videoWidth
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

  const frameCallbackHandler = useCallback(() => {
    if (!videoRef?.current) return

    const videoCurrentTime = videoRef.current.currentTime
    const newFrame = Math.round(videoCurrentTime * video.fps)
    setCurrentFrame(newFrame)
    videoRef.current.requestVideoFrameCallback(frameCallbackHandler)
  }, [video.fps])

  useEffect(() => {
    if (!videoRef?.current) return

    const videoEle = videoRef.current
    videoEle.requestVideoFrameCallback(frameCallbackHandler)
  }, [frameCallbackHandler])

  return (
    <div className="rounded-lg border border-gray-300 h-fit">
      <div className="group relative flex justify-center items-center h-44 bg-black rounded-t-lg">
        <div className="relative h-full w-full flex justify-center items-center">
          <video
            className="max-h-full max-w-full"
            src={getStoredUrl(video.url, video.storedIn)}
            ref={videoRef}
            onLoadedMetadata={handleImgLoad}
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
                {(polygons[currentFrame] || []).map((polygon) => (
                  <SimplePolygon
                    key={polygon.id}
                    stroke={polygon.stroke}
                    strokeWidth={polygon.strokeWidth}
                    shapeProps={{ ...polygon, points: getPoints(polygon.points.slice()) }}
                  />
                ))}

                {(lines[currentFrame] || []).map((line) => (
                  <SimpleLine
                    key={line.id}
                    stroke={line.stroke}
                    strokeWidth={line.strokeWidth}
                    shapeProps={{ ...line, points: getPoints(line.points.slice()) }}
                  />
                ))}

                {(rectangles[currentFrame] || []).map((rect) => (
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

                {(circles[currentFrame] || []).map((circle) => (
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

                {(faces[currentFrame] || []).map((face) => (
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

        <div className="hidden absolute bottom-0 left-0 right-0 h-16 w-full group-hover:block">
          <VideoControls
            color="white"
            videoObj={video}
            videoRef={videoRef}
            miniControls
            disableKeyShortcuts
          />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center">
          <p className="text-lg text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap w-[calc(100%-20px)]">
            {video.originalName}
          </p>
          {video.complete && (
            <div className="ml-2 text-green-500">
              <BsFillCheckCircleFill />
            </div>
          )}
        </div>
        <p className="text-gray-400 text-sm">{formatedDate}</p>
        <div className="flex justify-between mt-4">
          <OutlineButton
            link
            to={`/orgs/${orgId}/projects/${video.projectId}/files/${video.id}/annotate`}
          >
            Review
          </OutlineButton>
        </div>
      </div>
    </div>
  )
}

export default VideoReviewCard
