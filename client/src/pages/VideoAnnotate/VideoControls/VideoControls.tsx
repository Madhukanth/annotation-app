import { FC, RefObject, useEffect, useState } from 'react'
import { cn } from '@renderer/utils/cn'

import { useVideoPlayerStore } from '../store/video.store'
import PlayPause from './PlayPause'
import Volume from './Volume'
import PlaybackRate from './PlaybackRate'
import VideoTime from './VideoTime'
import VideoSlider from './VideoSlider'
import VideoFrame from './VideoFrame'
import { VideoObjType } from '@models/File.model'

type VideoControlsProps = {
  videoRef: RefObject<HTMLVideoElement>
  videoObj: VideoObjType
  disableKeyShortcuts?: boolean
  miniControls?: boolean
  color?: string
}
const VideoControls: FC<VideoControlsProps> = ({
  videoRef,
  videoObj,
  disableKeyShortcuts = false,
  miniControls = false,
  color = '#043c4a'
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState('1')
  const [volume, setVolume] = useState(0.5)
  const [currentTimeAndFrame, setCurrentTimeAndFrame] = useState({ time: 0, frame: 0 })
  const setCurrTimeAndFrameStore = useVideoPlayerStore((state) => state.setCurrentTimeAndFrame)

  useEffect(() => {
    if (miniControls) return
    setCurrTimeAndFrameStore(currentTimeAndFrame)
  }, [currentTimeAndFrame, miniControls])

  const resetState = () => {
    setIsPlaying(false)
    setSpeed('1')
    setVolume(0.5)
    setCurrentTimeAndFrame({ time: 0, frame: 0 })
  }

  useEffect(() => {
    return () => {
      resetState()
    }
  }, [])

  return (
    <div
      className={cn('px-4 w-full', {
        'h-full': !miniControls,
        'absolute bottom-0 z-20': miniControls
      })}
    >
      <VideoSlider
        miniControls={miniControls}
        videoRef={videoRef}
        videoObj={videoObj}
        currentTimeAndFrame={currentTimeAndFrame}
      />

      <div className="flex items-center">
        <PlayPause
          color={color}
          disableKeyShortcuts={disableKeyShortcuts}
          videoRef={videoRef}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />
        <VideoTime
          color={color}
          videoRef={videoRef}
          videoObj={videoObj}
          currentTimeAndFrame={currentTimeAndFrame}
          setCurrentTimeAndFrame={setCurrentTimeAndFrame}
        />
        {!miniControls && (
          <PlaybackRate
            color={color}
            disableKeyShortcuts={disableKeyShortcuts}
            videoRef={videoRef}
            speed={speed}
            setSpeed={setSpeed}
          />
        )}

        {!miniControls && (
          <Volume color={color} videoRef={videoRef} volume={volume} setVolume={setVolume} />
        )}

        {!miniControls && (
          <VideoFrame
            color={color}
            disableKeyShortcuts={disableKeyShortcuts}
            videoRef={videoRef}
            videoObj={videoObj}
            currentTimeAndFrame={currentTimeAndFrame}
          />
        )}
      </div>
    </div>
  )
}

export default VideoControls
