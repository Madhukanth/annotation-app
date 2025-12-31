import { FC, useRef } from 'react'
import { BsFillCheckCircleFill } from 'react-icons/bs'

import { VideoFileType } from '@models/File.model'
import OutlineButton from '@renderer/components/common/OutlineButton'
import { getStoredUrl } from '@renderer/utils/vars'
import VideoControls from '@renderer/pages/VideoAnnotate/VideoControls/VideoControls'
import { useOrgStore } from '@renderer/store/organization.store'

type VideoAnnotateCardProps = {
  video: VideoFileType
  isDeleting: boolean
  onDelete: () => void
}
const VideoAnnotateCard: FC<VideoAnnotateCardProps> = ({ video, isDeleting, onDelete }) => {
  const formatedDate = new Date(video.createdAt).toDateString()
  const videoRef = useRef<HTMLVideoElement>(null)
  const orgId = useOrgStore((s) => s.selectedOrg)

  return (
    <div className="rounded-lg border border-gray-300 h-fit">
      <div className="group relative flex justify-center items-center h-44 bg-black rounded-t-lg">
        <video
          ref={videoRef}
          className="max-h-full max-w-full object-cover"
          src={getStoredUrl(video.url, video.storedIn)}
        />
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

      <div className="py-4 px-4">
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
            className="overflow-hidden text-ellipsis"
            link
            to={`/orgs/${orgId}projects/${video.projectId}/files/${video.id}/annotate`}
          >
            Annotate
          </OutlineButton>

          <OutlineButton
            disabled={isDeleting}
            onClick={onDelete}
            className="text-red-500 overflow-hidden text-ellipsis"
          >
            Delete
          </OutlineButton>
        </div>
      </div>
    </div>
  )
}

export default VideoAnnotateCard
