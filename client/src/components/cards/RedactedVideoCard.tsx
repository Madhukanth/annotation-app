import { FC, useCallback, useRef, useState } from 'react'
import { Layer, Stage } from 'react-konva'
import { Link } from 'react-router-dom'
import { Stage as StageType } from 'konva/lib/Stage'

import { VideoModel } from '@models/video.model'
import VideoShapesRenderer from '@/components/shapes/VideoShapesRenderer'
import VideoControls from '@renderer/pages/VideoAnnotate/VideoControls/VideoControls'

type VideoSize = { height: number; width: number }
type StageScale = { height: number; width: number; offsetTop: number; offsetLeft: number }
type RedactedVideoCardProps = { video: VideoModel; onDelete: () => void }
const RedactedVideoCard: FC<RedactedVideoCardProps> = ({ video, onDelete }) => {
  const [videoSize, setVideoSize] = useState<VideoSize>({ height: 500, width: 500 })
  const [stageScale, setStageScale] = useState<StageScale>({
    height: 1,
    width: 1,
    offsetTop: 0,
    offsetLeft: 0
  })
  const [showShapes, setShowShapes] = useState(false)
  const stageRef = useRef<StageType | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

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
    setShowShapes(true)
  }, [])

  const handleImgLoad = useCallback(() => {
    if (!videoRef.current) return

    const naturalHeight = videoRef.current.videoHeight
    const naturalWidth = videoRef.current.videoWidth
    setVideoSize({ height: naturalHeight, width: naturalWidth })
    handleWindowResize()
  }, [handleWindowResize])

  return (
    <div className="rounded-lg border border-gray-300 h-fit">
      <div className="relative flex justify-center items-center h-64 bg-black rounded-t-lg">
        <video
          ref={videoRef}
          className="max-h-full max-w-full"
          src={`stechfile://${video.absPath}`}
          onLoadedMetadata={handleImgLoad}
        />

        {showShapes && (
          <Stage
            ref={stageRef}
            width={stageScale.width * videoSize.width}
            height={stageScale.height * videoSize.height}
            style={{ top: stageScale.offsetTop, left: stageScale.offsetLeft }}
            className="absolute z-10"
          >
            <Layer>
              <VideoShapesRenderer
                polygons={video.annotations.polygons || {}}
                rectangles={video.annotations.rectangles || {}}
                circles={video.annotations.circles || {}}
                faces={video.annotations.faces || {}}
                fps={video.metadata?.fps || 0}
                stageScale={stageScale}
                videoRef={videoRef}
              />
            </Layer>
          </Stage>
        )}

        <VideoControls
          disableKeyShortcuts
          videoRef={videoRef}
          videoObj={video}
          miniControls
          color="white"
        />
      </div>

      <div className="p-4">
        <div className="whitespace-nowrap overflow-hidden">
          <p className="text-xl text-gray-900">{video.name}</p>
        </div>
        <p className="text-neutral-400">{video.createdAt}</p>
        <div className="flex justify-between mt-4">
          <Link
            to={`/videos/${video.id}`}
            className="rounded-3xl text-brand1 border text-sm border-gray-300 py-2 px-4"
          >
            ReAnnotate
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

export default RedactedVideoCard
