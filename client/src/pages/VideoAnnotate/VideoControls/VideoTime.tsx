import { FC, RefObject, useCallback, useEffect } from 'react'

import { toHHMMSS, toHHMMSSFromFPS } from '../helpers/helpers'
import { VideoObjType } from '@models/File.model'

type VideoTimeProps = {
  videoRef: RefObject<HTMLVideoElement>
  videoObj: VideoObjType
  currentTimeAndFrame: { time: number; frame: number }
  setCurrentTimeAndFrame: (val: { time: number; frame: number }) => void
  color: string
}
const VideoTime: FC<VideoTimeProps> = ({
  videoRef,
  videoObj,
  currentTimeAndFrame,
  setCurrentTimeAndFrame,
  color
}) => {
  const frameCallbackHandler = useCallback(() => {
    if (!videoRef?.current) return

    const videoCurrentTime = videoRef.current.currentTime
    const fps = videoObj.fps || 0
    const newFrame = Math.round(videoCurrentTime * fps)
    setCurrentTimeAndFrame({ time: videoCurrentTime, frame: newFrame })
    videoRef.current.requestVideoFrameCallback(frameCallbackHandler)
  }, [videoObj])

  useEffect(() => {
    if (!videoRef?.current) return

    const videoEle = videoRef.current
    videoEle.requestVideoFrameCallback(frameCallbackHandler)
  }, [frameCallbackHandler])

  const fps = videoObj.fps || 24
  const totalFrames = videoObj.totalFrames || 0
  const duration = videoRef.current?.duration || videoObj.duration || 0

  return (
    <div className="mr-8 flex items-center" style={{ color }}>
      <div style={{ width: '88px' }}>
        {totalFrames
          ? toHHMMSSFromFPS(currentTimeAndFrame.time, currentTimeAndFrame.frame + 1, fps)
          : toHHMMSS(currentTimeAndFrame.time)}
      </div>
      <div>/</div>
      <div className="ml-2">
        {totalFrames ? toHHMMSSFromFPS(duration, totalFrames, fps) : toHHMMSS(duration)}
      </div>
    </div>
  )
}

export default VideoTime
