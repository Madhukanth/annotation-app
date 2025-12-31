import { ChangeEvent, FC, RefObject } from 'react'

import { cn } from '@renderer/utils/cn'
import { VideoFileType } from '@models/File.model'

type VideoSliderProps = {
  videoRef: RefObject<HTMLVideoElement>
  videoObj: VideoFileType
  currentTimeAndFrame: { time: number; frame: number }
  miniControls?: boolean
}
const VideoSlider: FC<VideoSliderProps> = ({
  videoRef,
  videoObj,
  currentTimeAndFrame,
  miniControls
}) => {
  const { time: currentTime } = currentTimeAndFrame

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return

    const ccTime = Number(e.target.value)
    videoRef.current.currentTime = ccTime
  }

  const duration = videoObj.duration || videoRef.current?.duration || 0
  const percent = (currentTime / duration) * 100
  const background = `linear-gradient(
    to right, #043c4a ${percent}%,
    lightgray ${percent}%)`

  return (
    <input
      onFocus={(e) => e.target.blur()}
      value={currentTime}
      min={0}
      max={duration}
      style={{ background }}
      step={0.01}
      onChange={handleChange}
      type="range"
      className={cn('w-full mt-4 slider', {
        'mb-1': miniControls,
        'mb-4': !miniControls
      })}
    />
  )
}

export default VideoSlider
