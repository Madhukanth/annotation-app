import { FC, RefObject, useEffect } from 'react'
import { BsFillPlayFill, BsFillPauseFill } from 'react-icons/bs'
import { useHotkeys } from 'react-hotkeys-hook'

type PlayPauseProps = {
  videoRef: RefObject<HTMLVideoElement>
  isPlaying: boolean
  setIsPlaying: (val: boolean) => void
  disableKeyShortcuts: boolean
  color: string
}
const PlayPause: FC<PlayPauseProps> = ({
  videoRef,
  isPlaying,
  setIsPlaying,
  disableKeyShortcuts,
  color
}) => {
  const play = () => {
    if (!videoRef.current) return

    videoRef.current.play()
    setIsPlaying(true)
  }

  const pause = () => {
    if (!videoRef.current) return

    videoRef.current.pause()
    setIsPlaying(false)
  }

  const togglePlayPause = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  useEffect(() => {
    if (!videoRef.current) return

    const videoEle = videoRef.current
    videoEle.addEventListener('ended', pause)

    return () => {
      videoEle.removeEventListener('ended', pause)
    }
  }, [])

  useHotkeys('space', togglePlayPause, [togglePlayPause], { enabled: !disableKeyShortcuts })

  if (isPlaying) {
    return (
      <button onFocus={(e) => e.target.blur()} className="mr-2" onClick={pause}>
        <BsFillPauseFill color={color} size={35} />
      </button>
    )
  }

  return (
    <button onFocus={(e) => e.target.blur()} className="mr-2" onClick={play}>
      <BsFillPlayFill color={color} size={35} />
    </button>
  )
}

export default PlayPause
