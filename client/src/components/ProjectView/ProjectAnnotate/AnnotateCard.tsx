import { FC, useState } from 'react'

import FileType from '@models/File.model'
import { BsFillCheckCircleFill } from 'react-icons/bs'
import CustomModal from '@renderer/components/common/CustomModal'
import ConfirmDelete from '@renderer/components/common/ConfirmDelete'

type AnnotateCardProps = {
  skip: number
  limit: number
  image: FileType
  isDeleting: boolean
  annotator?: string
  skipped: boolean
  onDelete: () => void
}
const AnnotateCard: FC<AnnotateCardProps> = ({ image, onDelete, isDeleting }) => {
  const [showDelete, setShowDelete] = useState(false)
  const formatedDate = new Date(image.createdAt).toDateString()

  return (
    <>
      {!!showDelete && (
        <CustomModal isOpen closeModal={() => setShowDelete(false)}>
          <ConfirmDelete
            loading={isDeleting}
            name={`image "${image.name}"`}
            onCancel={() => setShowDelete(false)}
            onDelete={onDelete}
          />
        </CustomModal>
      )}
      <div className="rounded-lg border border-gray-300 h-fit">
        <div className="flex justify-center items-center h-44 bg-black rounded-t-lg">
          <img className="max-h-full max-w-full object-cover" src={image.url} />
        </div>

        <div className="py-4 px-4">
          <div className="flex items-center">
            <p className="text-lg text-gray-900 overflow-hidden text-ellipsis whitespace-nowrap w-[calc(100%-20px)]">
              {image.originalName}
            </p>
            {image.complete && (
              <div className="ml-2 text-green-500">
                <BsFillCheckCircleFill />
              </div>
            )}
          </div>
          <p className="text-gray-400 text-sm">{formatedDate}</p>
        </div>
      </div>
    </>
  )
}

export default AnnotateCard
