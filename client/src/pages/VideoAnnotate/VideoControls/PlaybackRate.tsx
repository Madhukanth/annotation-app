import { FC, RefObject, useCallback } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

type PlaybackRateProps = {
  videoRef: RefObject<HTMLVideoElement>
  speed: string
  disableKeyShortcuts: boolean
  color: string
  setSpeed: (val: string) => void
}
const PlaybackRate: FC<PlaybackRateProps> = ({
  videoRef,
  speed,
  setSpeed,
  disableKeyShortcuts,
  color
}) => {
  const changeSpeed = useCallback((val: string) => {
    if (!videoRef.current) return

    videoRef.current.playbackRate = Number(val)
    setSpeed(val)
  }, [])

  const changeSpeedShortcut = useCallback(
    (val: string) => () => {
      changeSpeed(val)
    },
    [changeSpeed]
  )

  useHotkeys('1', changeSpeedShortcut('0.25'), [changeSpeedShortcut], {
    enabled: !disableKeyShortcuts
  })
  useHotkeys('2', changeSpeedShortcut('0.5'), [changeSpeedShortcut], {
    enabled: !disableKeyShortcuts
  })
  useHotkeys('3', changeSpeedShortcut('1'), [changeSpeedShortcut], {
    enabled: !disableKeyShortcuts
  })
  useHotkeys('4', changeSpeedShortcut('2'), [changeSpeedShortcut], {
    enabled: !disableKeyShortcuts
  })
  useHotkeys('5', changeSpeedShortcut('4'), [changeSpeedShortcut], {
    enabled: !disableKeyShortcuts
  })

  return (
    <select
      onFocus={(e) => e.target.blur()}
      value={speed}
      className="rounded-md h-8 px-1 mr-8 border"
      style={{ borderColor: color }}
      onChange={(e) => {
        changeSpeed(e.target.value)
      }}
    >
      <option value="0.25">0.25x</option>
      <option value="0.5">0.5x</option>
      <option value="1">1x</option>
      <option value="2">2x</option>
      <option value="4">4x</option>
    </select>
  )
}

export default PlaybackRate
