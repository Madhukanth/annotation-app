import { FC, useRef } from 'react'
import { Link } from 'react-router-dom'

import { VideoModel } from '@models/video.model'
import VideoControls from '@renderer/pages/VideoAnnotate/VideoControls/VideoControls'

type RawVideoCardProp = { video: VideoModel; onDelete: () => void }
const RawVideoCard: FC<RawVideoCardProp> = ({ video, onDelete }) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  return (
    <div className="rounded-lg border border-gray-300 h-fit">
      <div className="relative flex justify-center items-center h-64 bg-black rounded-t-lg">
        <video
          ref={videoRef}
          className="max-h-full max-w-full object-cover"
          src={`stechfile://${video.absPath}`}
        />

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
            to={video.id}
            className="rounded-3xl text-brand1 border text-sm border-gray-300 py-2 px-4"
          >
            Annotate
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

export default RawVideoCard
