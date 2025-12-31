import { FC, RefObject } from 'react'
import { BsFillVolumeUpFill, BsVolumeDownFill } from 'react-icons/bs'

type VolumeProps = {
  videoRef: RefObject<HTMLVideoElement>
  volume: number
  color: string
  setVolume: (val: number) => void
}
const Volume: FC<VolumeProps> = ({ videoRef, volume, setVolume, color }) => {
  const changeVolume = (val: number) => {
    if (!videoRef.current) return

    videoRef.current.volume = val
    setVolume(val)
  }

  const percent = (volume / 1) * 100
  const background = `linear-gradient(
    to right, ${color} ${percent}%,
    lightgray ${percent}%)`

  return (
    <div className="flex items-center">
      <button className="mr-1" onClick={() => changeVolume(0)}>
        <BsVolumeDownFill color={color} size={25} />
      </button>
      <input
        onFocus={(e) => e.target.blur()}
        value={volume}
        className="mr-2 slider w-14"
        type="range"
        style={{ background, width: '60px' }}
        min={0}
        step={0.1}
        max={1}
        onChange={(e) => changeVolume(Number(e.target.value))}
      />
      <button className="mr-8" onClick={() => changeVolume(1)}>
        <BsFillVolumeUpFill color={color} size={25} />
      </button>
    </div>
  )
}

export default Volume
