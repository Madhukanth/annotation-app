import { ChangeEvent, FC, KeyboardEvent, RefObject, useEffect, useState } from 'react'

import { useHotkeys } from 'react-hotkeys-hook'
import { VideoFileType } from '@models/File.model'

type VideoFrameProps = {
  videoRef: RefObject<HTMLVideoElement>
  videoObj: VideoFileType
  currentTimeAndFrame: { time: number; frame: number }
  disableKeyShortcuts: boolean
  color: string
}
const VideoFrame: FC<VideoFrameProps> = ({
  videoRef,
  videoObj,
  currentTimeAndFrame,
  disableKeyShortcuts,
  color
}) => {
  const { frame: currentFrame } = currentTimeAndFrame
  const [frame, setFrame] = useState(0)

  const duration = videoObj.duration || videoRef.current?.duration || 0
  const fps = videoObj.fps || 0
  const totalFrames = Math.round(duration * fps)

  useEffect(() => {
    setFrame(currentFrame + 1)
  }, [currentFrame])

  const handleFrameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    if (isNaN(val)) return

    setFrame(val)
  }

  const changeFrameTo = (newFrame: number) => {
    if (!videoObj?.fps || !videoRef.current) return

    const newTime = newFrame / videoObj.fps
    videoRef.current.currentTime = newTime
  }

  const handleEnter = (e: KeyboardEvent) => {
    if (e.key !== 'Enter') return

    if (frame > totalFrames || frame < 1) {
      return
    }

    changeFrameTo(frame - 1)
  }

  // We are showing +1 frame for user, so below add 0 or sub -2
  useHotkeys('f', () => changeFrameTo(frame), { enabled: !disableKeyShortcuts })
  useHotkeys('d', () => changeFrameTo(frame - 2), { enabled: !disableKeyShortcuts })
  useHotkeys('shift+f', () => changeFrameTo(frame + 4), { enabled: !disableKeyShortcuts })
  useHotkeys('shift+d', () => changeFrameTo(frame - 6), { enabled: !disableKeyShortcuts })

  return (
    <div className="flex items-center">
      <input
        max={totalFrames}
        onChange={handleFrameChange}
        min={1}
        step={1}
        value={frame}
        className="rounded-md mr-3 w-20 px-2 py-1 border"
        onKeyUp={handleEnter}
        style={{ borderColor: color }}
      />
      <div className="mr-2 text-xl" style={{ color }}>
        /
      </div>
      <div className="text-lg" style={{ color }}>
        {totalFrames}
      </div>
    </div>
  )
}

export default VideoFrame
